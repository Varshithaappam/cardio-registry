/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import HFFormView from "./components/forms/HFFormView";
import { getAllPatients } from "../api/patientApi";
import api from "../api/axios";
import { mapPatientRecords } from "./utils/patientMapper";

import Dashboard from "./components/Dashboard";
import PatientList from "./components/PatientList";
import MappingMatrix from "./components/MappingMatrix";
import PatientTimeline from "./components/PatientTimeline";
import ClinicalForm from "./components/ClinicalForm";
import NurseLogin from "./components/NurseLogin";
import { sanitizePayload } from "./utils/payloadSanitizer";

import {
  Heart,
  Users,
  Layers,
  LayoutDashboard,
  LogOut,
  UserCheck,
} from "lucide-react";

// Protected Route Guard
function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// Main Application Layout Container
function MainLayout({ records, nurse, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Active patient ID if URL is /patient/:id
  const matchPatient = path.match(/^\/patient\/([^/]+)/);
  const selectedPatientId = matchPatient ? matchPatient[1] : null;
  const activePatientRecord = selectedPatientId ? records.find((r) => String(r?.patient?.id) === String(selectedPatientId)) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
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

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left hidden xs:block">
                <span className="block text-xs font-black text-slate-100 leading-none">{nurse?.name || 'Clinician Admin'}</span>
                <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">{nurse?.role || 'CLINICIAN'}</span>
              </div>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0 ml-1"></span>
            </div>

            <button
              id="btn-logout"
              onClick={onLogout}
              className="px-3 py-2 bg-slate-800 hover:bg-red-950/30 text-slate-300 hover:text-red-400 border border-slate-700/60 hover:border-red-500/30 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Secure Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button
            id="nav-dash"
            onClick={() => navigate('/dashboard')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 border ${
              path === '/dashboard' || path === '/'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Clinical Intelligence Dashboard</span>
          </button>

          <button
            id="nav-patients"
            onClick={() => navigate('/patients')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 border ${
              path === '/patients' || path.startsWith('/patient/')
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Master Patient Registry</span>
          </button>

          <button
            id="nav-mapping"
            onClick={() => navigate('/mapping')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 border ${
              path === '/mapping'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Source Clinical Form Mapping</span>
          </button>

          {selectedPatientId && activePatientRecord && (
            <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3.5 animate-fadeIn">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Patient Scope</span>
              <div>
                <span className="text-xs font-bold block truncate">{activePatientRecord.patient.name}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">MR No: {activePatientRecord.patient.mrNo}</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
                <button
                  id="aside-view-portfolio"
                  onClick={() => navigate(`/patient/${selectedPatientId}`)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-bold transition-colors ${
                    path === `/patient/${selectedPatientId}` ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  ✔ View Longitudinal Timeline
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Right Content Panel */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 shrink-0 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4">
          <span>CARE Clinical Registry Portal • Fully verified according to standard guidelines & medical data quality practices.</span>
        </div>
      </footer>
    </div>
  );
}

// Page Components
function DashboardPage({ records }) {
  const navigate = useNavigate();
  return <Dashboard patients={records} onSelectPatient={(id) => navigate(`/patient/${id}`)} />;
}

function PatientListPage({ records, loadPatients }) {
  const navigate = useNavigate();
  return (
    <PatientList
      patients={records}
      onRegisterPatient={async (newRecord) => {
        await loadPatients();
        const pid = newRecord?.patient?.id;
        if (pid) navigate(`/patient/${pid}`);
      }}
      onSelectPatient={(id) => navigate(`/patient/${id}`)}
      onAddEventClick={(patientId, formType) => navigate(`/patient/${patientId}/edit?formType=${formType}`)}
      onBack={() => navigate('/dashboard')}
    />
  );
}

function PatientTimelinePage({ records, loadPatients }) {
  const params = useParams();
  const patientId = params.id || params.patientId;
  const navigate = useNavigate();

  const record = records.find((r) => String(r?.patient?.id) === String(patientId)) || null;

  if (!record) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Patient Portfolio Not Found</h3>
        <p className="text-slate-500 text-sm mt-2 mb-4">Patient record ID #{patientId} could not be located.</p>
        <button onClick={() => navigate('/patients')} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs">
          Return to Master Patient Registry
        </button>
      </div>
    );
  }

  const handleDeleteClinicalEvent = async (eventId, type, hfId) => {
    if (!window.confirm('Are you sure you want to soft-delete this clinical record? This record will be archived as read-only.')) {
      return;
    }
    const targetHfId = hfId || eventId;
    if (type === 'HF' || type === 'HF Assessment') {
      try {
        await api.delete(`/hf-registry/${targetHfId}`);
        alert('HF Registry record soft-deleted successfully.');
        loadPatients();
        return;
      } catch (err) {
        console.error('Error soft-deleting HF record:', err);
        alert(err.response?.data?.message || 'Failed to soft-delete record.');
        return;
      }
    }
  };

  return (
    <PatientTimeline
      record={record}
      onBack={() => navigate('/patients')}
      onAddEventClick={(formType) => navigate(`/patient/${patientId}/edit?formType=${formType}`)}
      onEditEventClick={(hfId) => navigate(`/patient/${patientId}/edit/${hfId}`)}
      onViewEventDetails={(evt, type) => {
        const targetHfId = evt.hf_id || evt.hfId || evt.id;
        navigate(`/patient/${patientId}/view/${targetHfId}`, { state: { from: `/patient/${patientId}` } });
      }}
      onDeleteEvent={handleDeleteClinicalEvent}
      onRefreshPatient={loadPatients}
    />
  );
}

function EditFormPage({ records, loadPatients }) {
  const params = useParams();
  const patientId = params.id || params.patientId;
  const hfId = params.hfId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formType = searchParams.get('formType') || 'HF';
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(!!hfId);

  const activePatientRecord = records.find((r) => String(r?.patient?.id) === String(patientId)) || null;

  useEffect(() => {
    if (hfId) {
      async function fetchEditData() {
        try {
          setLoading(true);
          const response = await api.get(`/hf-assessment/${hfId}`);
          if (response.data && response.data.success) {
            setEditingRecord(response.data.data);
          }
        } catch (err) {
          console.error('Error fetching HF assessment for editing:', err);
        } finally {
          setLoading(false);
        }
      }
      fetchEditData();
    }
  }, [hfId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading form details...</div>;
  }

  if (!activePatientRecord) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Patient Record Not Found</h3>
        <button onClick={() => navigate('/patients')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Return to Patients
        </button>
      </div>
    );
  }

  return (
    <ClinicalForm
      patientRecord={activePatientRecord}
      formType={formType}
      editingRecord={editingRecord}
      onCancel={() => navigate(-1)}
      onSave={async (eventData, type) => {
        if (type === 'HF') {
          try {
            const sanitizedData = sanitizePayload(eventData);
            const isDraft = eventData.isDraft === true;
            let res;
            if (isDraft) {
              try {
                res = await api.post('/hf-assessment/draft', sanitizedData);
              } catch (draftErr) {
                if (draftErr.response?.status === 404) {
                  // Fallback to root endpoint if backend process has not been restarted yet
                  res = await api.post('/hf-assessment', { ...sanitizedData, isDraft: true });
                } else {
                  throw draftErr;
                }
              }
              const regNo = res.data?.data?.hf_registry_no || 'HF Draft';
              alert(`Draft saved successfully (Registry No: ${regNo}). You can resume and complete it anytime.`);
            } else {
              res = await api.post('/hf-assessment', { ...sanitizedData, isDraft: false });
              alert('Heart Failure Assessment details submitted and finalized in database successfully.');
            }
            await loadPatients();
          } catch (err) {
            console.error('Error saving HF assessment:', err);
            alert(err.response?.data?.message || 'Failed to save Heart Failure Assessment details.');
          }
        }
        navigate(`/patient/${patientId}`);
      }}
      onBackPatients={() => navigate(`/patient/${patientId}`)}
    />
  );
}

function MappingMatrixPage() {
  return <MappingMatrix />;
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [nurse, setNurse] = useState(() => {
    try {
      const uStr = localStorage.getItem('user');
      return uStr ? JSON.parse(uStr) : null;
    } catch (e) {
      return null;
    }
  });

  const loadPatients = async () => {
    try {
      const response = await getAllPatients();
      if (response.success) {
        const mappedPatients = mapPatientRecords(response.data);
        setRecords(mappedPatients);
        return mappedPatients;
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
    return [];
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setNurse(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            nurse ? <Navigate to="/dashboard" replace /> : (
              <NurseLogin
                onLoginSuccess={(userData) => {
                  setNurse(userData);
                }}
              />
            )
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout records={records} nurse={nurse} onLogout={handleLogout} />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage records={records} />} />
            <Route path="/clinical-dashboard" element={<Navigate to="/dashboard" replace />} />

            <Route path="/patients" element={<PatientListPage records={records} loadPatients={loadPatients} />} />
            <Route path="/master-registry" element={<Navigate to="/patients" replace />} />

            {/* Support both :id and :patientId parameter names */}
            <Route path="/patient/:id" element={<PatientTimelinePage records={records} loadPatients={loadPatients} />} />
            <Route path="/patient/:id/edit" element={<EditFormPage records={records} loadPatients={loadPatients} />} />
            <Route path="/patient/:id/edit/:hfId" element={<EditFormPage records={records} loadPatients={loadPatients} />} />
            <Route path="/patient/:id/view" element={<HFFormView />} />
            <Route path="/patient/:id/view/:recordId" element={<HFFormView />} />
            <Route path="/hf-form/view/:recordId" element={<HFFormView />} />

            <Route path="/mapping" element={<MappingMatrixPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
