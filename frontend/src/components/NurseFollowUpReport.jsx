import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import HFFollowUpForm from './forms/HFFollowUpForm';
import StemiFollowUpForm from './forms/StemiFollowUpForm';
import NstemiFollowUpForm from './forms/NstemiFollowUpForm';
import HfFollowupPdfModal from './modals/HfFollowupPdfModal';
import AcsFollowupPdfModal from './modals/AcsFollowupPdfModal';
import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
  formatTimeForDisplay,
  formatDateForDatabase,
  getLocalDateString
} from '../utils/dateUtils';
import {
  PhoneCall,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Phone,
  X,
  Send,
  Stethoscope,
  ClipboardList,
  RefreshCw,
  Activity,
  ArrowUpDown,
  Calendar,
  FileText
} from 'lucide-react';

const OVERALL_REGISTRY_STATUS_OPTIONS = [
  'All (Default)',
  'Pending',
  'In Progress',
  'Completed',
  'Unable to Contact',
  'Deceased'
];

export default function NurseFollowUpReport() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [registryTypeFilter, setRegistryTypeFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Column Sorting State (Default: Follow-Up Interval Ascending)
  const [sortConfig, setSortConfig] = useState({ key: 'timeframe', direction: 'asc' });

  // PDF Response Preview Modal State (HF)
  const [pdfModalLog, setPdfModalLog] = useState(null);
  const [pdfModalTask, setPdfModalTask] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // PDF Response Preview Modal State (STEMI & NSTEMI)
  const [acsPdfModalLog, setAcsPdfModalLog] = useState(null);
  const [acsPdfModalTask, setAcsPdfModalTask] = useState(null);
  const [acsPdfModalType, setAcsPdfModalType] = useState('STEMI');
  const [isAcsPdfModalOpen, setIsAcsPdfModalOpen] = useState(false);

  const openPdfModal = (log, task) => {
    setPdfModalLog(log);
    setPdfModalTask(task);
    setIsPdfModalOpen(true);
  };

  const openAcsPdfModal = (log, task, type = 'STEMI') => {
    setAcsPdfModalLog(log);
    setAcsPdfModalTask(task);
    setAcsPdfModalType(type);
    setIsAcsPdfModalOpen(true);
  };

  // Toggle Sort Direction
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key: null, direction: 'asc' };
    });
  };

  // Convert YYYY-MM-DD to DD-MM-YYYY (for input display)
  const toDDMMYYYY = (isoStr) => {
    return formatDateForDisplay(isoStr);
  };

  // Convert DD-MM-YYYY or YYYY-MM-DD to YYYY-MM-DD (for comparison)
  const toYYYYMMDD = (dateStr) => {
    return formatDateForDatabase(dateStr) || dateStr;
  };

  // Date Formatting Utility (DD-MM-YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return formatDateForDisplay(dateString);
  };

  // Date & Time Formatting Utility (DD-MM-YYYY, HH:mm in Indian Format)
  const formatDateTime = (dateString) => {
    if (!dateString) return 'None Recorded';
    return formatDateTimeForDisplay(dateString);
  };

  // Custom sort weight mapping for Follow-Up Intervals (lowercase & trimmed)
  const intervalWeights = {
    '1-week': 1,
    '2-weeks': 2,
    '1-month': 3,
    '3-months': 4,
    '6-months': 5,
    '1-year': 6,
    'no follow-up needed': 99
  };

  const getIntervalWeight = (timeframe) => {
    // Safely normalize null, undefined, or empty string to '1-month' (matching the table cell UI fallback)
    const normalized = (timeframe || '1-month').toString().toLowerCase().trim();

    if (intervalWeights[normalized] !== undefined) {
      return intervalWeights[normalized];
    }

    // Fuzzy matching for spaces, alternate hyphens, or extra characters
    if (normalized.includes('1-week') || normalized.includes('1 week')) return 1;
    if (normalized.includes('2-week') || normalized.includes('2 week')) return 2;
    if (normalized.includes('1-month') || normalized.includes('1 month')) return 3;
    if (normalized.includes('3-month') || normalized.includes('3 month')) return 4;
    if (normalized.includes('6-month') || normalized.includes('6 month')) return 5;
    if (normalized.includes('1-year') || normalized.includes('1 year')) return 6;
    if (normalized.includes('no follow-up') || normalized.includes('none')) return 99;

    return 999;
  };

  // Helper to render active sort indicator icons
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity ml-1.5 inline-block shrink-0" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-3.5 h-3.5 text-blue-600 font-bold ml-1.5 inline-block shrink-0" />;
    }
    return <ChevronDown className="w-3.5 h-3.5 text-blue-600 font-bold ml-1.5 inline-block shrink-0" />;
  };

  // Helper to extract registry type (STEMI, NSTEMI, HF)
  const getTaskRegistryType = (task) => {
    if (task.registry_type) return task.registry_type;
    const src = (task.source_registry || '').toUpperCase();
    if (src.includes('NSTEMI')) return 'NSTEMI';
    if (src.includes('STEMI')) return 'STEMI';
    return 'HF';
  };

  // Unique composite key generator for multi-registry rows
  const getUniqueKey = (task) =>
    `${task.reg_patient_id}-${getTaskRegistryType(task)}`;

  // Expanded Row State (Composite Unique Key: `${patient_id}-${registry_type}`)
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [expandedHistoryKeys, setExpandedHistoryKeys] = useState({});
  const [patientLogs, setPatientLogs] = useState({});
  const [logsLoading, setLogsLoading] = useState(false);

  // Toggle collapsible historical admissions
  const toggleHistoricalLogs = (key) => {
    setExpandedHistoryKeys((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Group logs into Current Episode vs Previous Historical Episodes
  const groupLogsByEpisode = (logs) => {
    if (!logs || logs.length === 0) return { currentEpisode: null, historicalEpisodes: [] };

    const groups = {};

    logs.forEach((log) => {
      const epKey = log.episode_id 
        || (log.registry_id ? `${log.registry_type || 'HF'}-${String(log.registry_id).padStart(2, '0')}` : 'Episode-Log');

      if (!groups[epKey]) {
        groups[epKey] = {
          key: epKey,
          episodeId: log.episode_id || epKey,
          registryId: log.registry_id,
          registryType: log.registry_type || 'HF',
          status: log.episode_status || 'Completed',
          isCurrent: Boolean(log.is_current_episode === 1 || log.is_current_episode === true),
          logs: []
        };
      }
      groups[epKey].logs.push(log);
    });

    const allGroups = Object.values(groups);

    // Pick the current episode (explicitly flagged, or the first/latest group)
    let currentEpisode = allGroups.find((g) => g.isCurrent);
    if (!currentEpisode && allGroups.length > 0) {
      currentEpisode = allGroups[0];
    }

    const historicalEpisodes = allGroups.filter((g) => g !== currentEpisode);

    return { currentEpisode, historicalEpisodes };
  };

  // Quick Outreach Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detailed Heart Failure Follow-up Form Modal State
  const [selectedHfTask, setSelectedHfTask] = useState(null);
  const [isHfModalOpen, setIsHfModalOpen] = useState(false);

  // Detailed STEMI & NSTEMI Follow-up Form Modal State
  const [selectedStemiTask, setSelectedStemiTask] = useState(null);
  const [isStemiModalOpen, setIsStemiModalOpen] = useState(false);
  const [selectedNstemiTask, setSelectedNstemiTask] = useState(null);
  const [isNstemiModalOpen, setIsNstemiModalOpen] = useState(false);

  // Log Outreach Form State
  const [formData, setFormData] = useState({
    contact_mode: 'Phone Call',
    outcome: 'Patient Contacted & Appointment Confirmed',
    status: 'Pending Nurse Outreach',
    target_date: '',
    symptoms_status: 'Stable - No worsening shortness of breath',
    medication_adherence: 'Compliant - Taking all meds as prescribed',
    assigned_nurse: '',
    notes: ''
  });

  // Open Detailed HF Follow-Up Form Modal
  const handleOpenHfModal = (task) => {
    setSelectedHfTask(task);
    setIsHfModalOpen(true);
  };

  // Open Detailed STEMI / NSTEMI Form Modals
  const handleOpenStemiModal = (task) => {
    setSelectedStemiTask(task);
    setIsStemiModalOpen(true);
  };

  const handleOpenNstemiModal = (task) => {
    setSelectedNstemiTask(task);
    setIsNstemiModalOpen(true);
  };

  // Helper to extract currently logged in user details for auto-assigning nurse
  const getLoggedInNurseName = () => {
    try {
      const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.name) return u.name;
        if (u.full_name) return u.full_name;
        if (u.username) return u.username;
        if (u.nurse_name) return u.nurse_name;
      }
    } catch (e) {}
    return sessionStorage.getItem('userName') || localStorage.getItem('userName') || '';
  };

  // Submit Detailed STEMI / NSTEMI Follow-up Log to Backend API
  const handleSaveAcsFollowup = async (formPayload, type = 'STEMI') => {
    const selectedTaskToUse = type === 'STEMI' ? selectedStemiTask : selectedNstemiTask;
    if (!selectedTaskToUse) return;
    const taskIdToUse = selectedTaskToUse.task_id || selectedTaskToUse.id || selectedTaskToUse.source_record_id;
    setSubmitting(true);
    const regType = type;

    let notesSummary = `[${type} Detailed Follow-up]\n`;
    notesSummary += `Mode: ${formPayload.followup_conducted || 'Telephonic'} (Attempt #${formPayload.attempt_number || 1}) | Answering: ${formPayload.answering_status || 'Yes'}\n`;
    notesSummary += `Health Overview: ${formPayload.health_status || 'Healthy'} ${formPayload.health_unhealthy_details ? `(${formPayload.health_unhealthy_details})` : ''}\n`;
    if ((formPayload.selected_symptoms || []).length > 0) {
      notesSummary += `Symptoms Checklist: ${formPayload.selected_symptoms.join(', ')}\n`;
    }
    notesSummary += `Medication Adherence: ${formPayload.medication_adherence || 'Yes'} | Side Effects: ${formPayload.side_effects_observed || 'No'} | Physician Changes: ${formPayload.physician_medication_changes || 'No'}\n`;
    
    const activeMeds = (formPayload.drug_grid || [])
      .filter((d) => d.taking === 'Yes' || d.inRecentVisit === 'Yes')
      .map((d) => d.isOther && d.otherName ? d.otherName : d.name);
    if (activeMeds.length > 0) {
      notesSummary += `Current Key Meds: ${activeMeds.slice(0, 6).join(', ')}${activeMeds.length > 6 ? '...' : ''}\n`;
    }

    const labParts = [];
    if (formPayload.trop_i_result) labParts.push(`Trop-I: ${formPayload.trop_i_result}`);
    if (formPayload.creatinine_result) labParts.push(`Creatinine: ${formPayload.creatinine_result}`);
    if (formPayload.bnp_nt_probnp_result) labParts.push(`BNP: ${formPayload.bnp_nt_probnp_result}`);
    if (formPayload.hemoglobin_result) labParts.push(`Hb: ${formPayload.hemoglobin_result}`);
    if (formPayload.sodium_result) labParts.push(`Sodium: ${formPayload.sodium_result}`);
    if (formPayload.potassium_result) labParts.push(`Potassium: ${formPayload.potassium_result}`);
    if (formPayload.echo_done) labParts.push(`2D Echo: ${formPayload.echo_done}`);
    if (labParts.length > 0) {
      notesSummary += `Labs & Investigations: ${labParts.join(' | ')}\n`;
    }

    if (formPayload.has_major_clinical_event === 'Yes' && (formPayload.selected_clinical_events || []).length > 0) {
      notesSummary += `Major Clinical Events: ${formPayload.selected_clinical_events.join(', ')}\n`;
    }

    if (formPayload.is_deceased === 'Yes') {
      notesSummary += `Deceased: Yes (Cause: ${formPayload.cause_of_death || 'Cardiac'}, Place: ${formPayload.place_of_death || 'N/A'})\n`;
    }

    if (formPayload.patient_feedback) {
      notesSummary += `Feedback: ${formPayload.patient_feedback}`;
    }

    const chosenStatus = formPayload.overall_registry_status || formPayload.status || 'Completed';
    const payload = {
      is_detailed_stemi_form: type === 'STEMI',
      is_detailed_nstemi_form: type === 'NSTEMI',
      is_detailed_acs_form: true,
      reg_patient_id: selectedTaskToUse.reg_patient_id,
      task_id: taskIdToUse || null,
      registry_type: regType,
      source_registry: selectedTaskToUse.source_registry,
      source_record_id: selectedTaskToUse.source_record_id,
      timeframe: selectedTaskToUse.timeframe,
      visit_mode: formPayload.followup_conducted || selectedTaskToUse.visit_mode,
      contact_mode: formPayload.followup_conducted || 'Phone Call',
      outcome: formPayload.answering_status === 'Yes' 
        ? `Detailed ${type} Form Logged` 
        : `Unreachable - ${formPayload.no_answer_reason || 'No Answer'}`,
      status: chosenStatus,
      overall_registry_status: chosenStatus,
      symptoms_status: (formPayload.selected_symptoms || []).length > 0
        ? (formPayload.selected_symptoms || []).join(', ').slice(0, 95)
        : 'Stable - No symptoms',
      medication_adherence: formPayload.medication_adherence === 'Yes' 
        ? 'Compliant - Taking all meds as prescribed' 
        : 'Non-Compliant / Side Effects',
      assigned_nurse: getLoggedInNurseName() || selectedTaskToUse.assigned_nurse || 'Cardiac Care Nurse',
      notes: notesSummary,
      ...formPayload
    };

    try {
      let response;
      if (taskIdToUse) {
        try {
          response = await api.post(`/nurse-dashboard/tasks/${taskIdToUse}/log`, payload);
        } catch (e1) {
          response = await api.post(`/nurse-followup-report/tasks/${taskIdToUse}/log`, payload);
        }
      } else {
        response = await api.post(`/nurse-dashboard/logs`, payload);
      }

      if (response.data && response.data.success) {
        if (type === 'STEMI') {
          setIsStemiModalOpen(false);
          setSelectedStemiTask(null);
        } else {
          setIsNstemiModalOpen(false);
          setSelectedNstemiTask(null);
        }
        await fetchTasks();
        const key = getUniqueKey(selectedTaskToUse);
        if (expandedRowKey === key) {
          await fetchPatientLogs(selectedTaskToUse.reg_patient_id, regType);
        }
      } else {
        throw new Error(response.data?.message || `Failed to save ${type} follow-up record.`);
      }
    } catch (err) {
      console.error(`Error saving ${type} follow-up record:`, err);
      alert(`Failed to save ${type} follow-up record: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Detailed HF Follow-up Log to Backend API
  const handleSaveHfFollowup = async (formPayload) => {
    if (!selectedHfTask) return;
    setSubmitting(true);
    const regType = getTaskRegistryType(selectedHfTask);

    // Build formatted clinical summary for instant timeline log preview
    let notesSummary = `[HF Detailed Follow-up]\n`;
    notesSummary += `Mode: ${formPayload.followup_conducted || 'Telephonic'} (Attempt #${formPayload.attempt_number || 1}) | Answering: ${formPayload.answering_status || 'Yes'}\n`;
    notesSummary += `Health Overview: ${formPayload.health_status || 'Healthy'} ${formPayload.health_unhealthy_details ? `(${formPayload.health_unhealthy_details})` : ''}\n`;
    if ((formPayload.selected_symptoms || []).length > 0) {
      notesSummary += `Symptoms Checklist: ${formPayload.selected_symptoms.join(', ')}\n`;
    }
    notesSummary += `Medication Adherence: ${formPayload.medication_adherence || 'Yes'} | Side Effects: ${formPayload.side_effects_observed || 'No'} | Physician Changes: ${formPayload.physician_medication_changes || 'No'}\n`;
    
    // Key Meds from grid
    const activeMeds = (formPayload.drug_grid || [])
      .filter((d) => d.taking === 'Yes' || d.inRecentVisit === 'Yes')
      .map((d) => d.isOther && d.otherName ? d.otherName : d.name);
    if (activeMeds.length > 0) {
      notesSummary += `Current Key Meds: ${activeMeds.slice(0, 6).join(', ')}${activeMeds.length > 6 ? '...' : ''}\n`;
    }

    // Labs
    const labParts = [];
    if (formPayload.bnp_nt_probnp_result) labParts.push(`BNP: ${formPayload.bnp_nt_probnp_result}`);
    if (formPayload.creatinine_result) labParts.push(`Creatinine: ${formPayload.creatinine_result}`);
    if (formPayload.sodium_result) labParts.push(`Sodium: ${formPayload.sodium_result}`);
    if (formPayload.hemoglobin_result) labParts.push(`Hb: ${formPayload.hemoglobin_result}`);
    if (formPayload.echo_done) labParts.push(`2D Echo: ${formPayload.echo_done}`);
    if (labParts.length > 0) {
      notesSummary += `Labs & Investigations: ${labParts.join(' | ')}\n`;
    }

    if (formPayload.has_major_clinical_event === 'Yes' && (formPayload.selected_clinical_events || []).length > 0) {
      notesSummary += `Major Clinical Events: ${formPayload.selected_clinical_events.join(', ')}\n`;
    }

    if (formPayload.is_deceased === 'Yes') {
      notesSummary += `Deceased: Yes (Cause: ${formPayload.cause_of_death || 'Cardiac'}, Place: ${formPayload.place_of_death || 'N/A'})\n`;
    }

    if (formPayload.patient_feedback) {
      notesSummary += `Feedback: ${formPayload.patient_feedback}`;
    }

    const taskIdToUse = selectedHfTask.task_id || selectedHfTask.id || selectedHfTask.source_record_id;
    const chosenStatus = formPayload.overall_registry_status || formPayload.status || 'Completed';
    const payload = {
      is_detailed_hf_form: true,
      reg_patient_id: selectedHfTask.reg_patient_id,
      task_id: taskIdToUse || null,
      registry_type: regType,
      source_registry: selectedHfTask.source_registry,
      source_record_id: selectedHfTask.source_record_id,
      timeframe: selectedHfTask.timeframe,
      visit_mode: formPayload.followup_conducted || selectedHfTask.visit_mode,
      contact_mode: formPayload.followup_conducted || 'Phone Call',
      outcome: formPayload.answering_status === 'Yes' 
        ? 'Detailed HF Form Logged' 
        : `Unreachable - ${formPayload.no_answer_reason || 'No Answer'}`,
      status: chosenStatus,
      overall_registry_status: chosenStatus,
      symptoms_status: (formPayload.selected_symptoms || []).length > 0
        ? (formPayload.selected_symptoms || []).join(', ').slice(0, 95)
        : 'Stable - No worsening shortness of breath',
      medication_adherence: formPayload.medication_adherence === 'Yes' 
        ? 'Compliant - Taking all meds as prescribed' 
        : 'Non-Compliant / Side Effects',
      assigned_nurse: getLoggedInNurseName() || selectedHfTask.assigned_nurse || 'Staff Nurse',
      notes: notesSummary,
      ...formPayload
    };

    try {
      let response;
      if (taskIdToUse) {
        try {
          response = await api.post(`/nurse-dashboard/tasks/${taskIdToUse}/log`, payload);
        } catch (e1) {
          response = await api.post(`/nurse-followup-report/tasks/${taskIdToUse}/log`, payload);
        }
      } else {
        response = await api.post(`/nurse-dashboard/logs`, payload);
      }

      if (response.data && response.data.success) {
        setIsHfModalOpen(false);
        setSelectedHfTask(null);
        await fetchTasks();
        const key = getUniqueKey(selectedHfTask);
        if (expandedRowKey === key) {
          await fetchPatientLogs(selectedHfTask.reg_patient_id, regType);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to save Heart Failure follow-up record.');
      }
    } catch (err) {
      console.error('Error saving HF follow-up form:', err);
      const serverMsg = err.friendlyError?.message || err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`Save Error: ${serverMsg || 'Failed to record HF follow-up.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Fetch Patient-Centric Tasks strictly from SQL Database
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/nurse-dashboard/tasks');
      if (response.data && response.data.success) {
        setTasks(response.data.data || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching nurse follow-up tasks:', err);
      setError(err.response?.data?.message || 'Failed to connect to database.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 2. Fetch Consolidated Patient Timeline Logs filtered by regPatientId and registryType
  const fetchPatientLogs = async (regPatientId, registryType = 'HF') => {
    setLogsLoading(true);
    const key = `${regPatientId}-${registryType}`;
    try {
      const response = await api.get(`/nurse-dashboard/${regPatientId}/logs?registry=${registryType}&registry_type=${registryType}`);
      if (response.data && response.data.success) {
        const rawLogs = response.data.data || [];
        const uniqueLogs = [];
        const seenKeys = new Set();
        for (const log of rawLogs) {
          const uKey = log.log_id ? `log-${log.log_id}` : `${log.log_type}-${log.created_at}-${log.outcome}`;
          if (!seenKeys.has(uKey)) {
            seenKeys.add(uKey);
            uniqueLogs.push(log);
          }
        }
        setPatientLogs((prev) => ({ ...prev, [key]: uniqueLogs }));
      } else {
        setPatientLogs((prev) => ({ ...prev, [key]: [] }));
      }
    } catch (err) {
      console.error(`Error fetching timeline logs for patient ${regPatientId} (${registryType}):`, err);
      setPatientLogs((prev) => ({ ...prev, [key]: [] }));
    } finally {
      setLogsLoading(false);
    }
  };

  const toggleExpandRow = (task) => {
    const key = getUniqueKey(task);
    const registryType = getTaskRegistryType(task);
    if (expandedRowKey === key) {
      setExpandedRowKey(null);
    } else {
      setExpandedRowKey(key);
      if (!patientLogs[key]) {
        fetchPatientLogs(task.reg_patient_id, registryType);
      }
    }
  };

  // 3. Dynamic KPI Calculations strictly from fetched state
  const kpis = useMemo(() => {
    const total = tasks.length;
    const required = tasks.filter((t) => {
      const s = (t.overall_registry_status || t.status || '').toLowerCase();
      return s === 'required' || s === 'follow-up scheduled';
    }).length;
    const pending = tasks.filter((t) => {
      const s = (t.overall_registry_status || t.status || '').toLowerCase();
      return s === 'pending' || s === 'pending nurse outreach' || s === 'pending outreach';
    }).length;
    
    const today = getLocalDateString();
    const overdue = tasks.filter((t) => {
      const s = (t.overall_registry_status || t.status || '').toLowerCase();
      return (t.target_date && t.target_date < today) || s === 'missed / overdue' || s === 'overdue / urgent action';
    }).length;
    const completed = tasks.filter((t) => {
      const s = (t.overall_registry_status || t.status || '').toLowerCase();
      return s === 'completed';
    }).length;
    const percentage = total > 0 ? Math.round((required / total) * 100) : 0;

    return { total, required, percentage, pending, overdue, completed };
  }, [tasks]);

  // 4. Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      // 1. Search Query Filter
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = task.patient_name?.toLowerCase().includes(q);
      const mrnMatch = task.mr_no?.toLowerCase().includes(q);
      const phoneMatch = task.phone_no?.includes(q);
      const matchesSearch = !q || nameMatch || mrnMatch || phoneMatch;

      // 2. Overall Registry Status Filter
      let matchesStatus = true;
      if (statusFilter && statusFilter !== 'All' && statusFilter !== 'All (Default)') {
        const rawTaskStatus = (task.overall_registry_status || task.status || '').trim();
        const normTaskStatus = rawTaskStatus.toLowerCase();
        const normFilter = statusFilter.toLowerCase();

        if (statusFilter === 'Pending') {
          matchesStatus = normTaskStatus === 'pending' || 
                          normTaskStatus === 'pending nurse outreach' || 
                          normTaskStatus === 'pending outreach';
        } else if (statusFilter === 'In Progress') {
          matchesStatus = normTaskStatus === 'in progress' || 
                          normTaskStatus === 'in-progress' || 
                          normTaskStatus === 'inprogress';
        } else if (statusFilter === 'Completed') {
          matchesStatus = normTaskStatus === 'completed' || 
                          normTaskStatus === 'patient contacted & appointment confirmed' || 
                          normTaskStatus === 'detailed form logged';
        } else if (statusFilter === 'Unable to Contact') {
          matchesStatus = normTaskStatus === 'unable to contact' || 
                          normTaskStatus === 'patient unreachable' || 
                          normTaskStatus.includes('unreachable');
        } else if (statusFilter === 'Deceased') {
          matchesStatus = normTaskStatus === 'deceased' || 
                          String(task.is_deceased).toLowerCase() === 'yes';
        } else if (statusFilter === 'Required') {
          matchesStatus = normTaskStatus === 'required' || normTaskStatus === 'follow-up scheduled';
        } else if (statusFilter === 'Missed / Overdue') {
          matchesStatus = normTaskStatus === 'missed / overdue' || normTaskStatus === 'overdue / urgent action';
        } else {
          matchesStatus = normTaskStatus === normFilter;
        }
      }

      // 3. Registry Pathway Filter
      let matchesRegistry = true;
      if (registryTypeFilter !== 'All') {
        const regType = getTaskRegistryType(task).toUpperCase();
        matchesRegistry = (regType === registryTypeFilter.toUpperCase());
      }

      // 4. Follow-Up Date Range Filter
      let matchesDate = true;
      const targetIso = task.target_date ? String(task.target_date).split('T')[0] : '';
      if (fromDate && targetIso) {
        const fromIso = toYYYYMMDD(fromDate);
        if (fromIso) {
          matchesDate = matchesDate && targetIso >= fromIso;
        }
      }
      if (toDate && targetIso) {
        const toIso = toYYYYMMDD(toDate);
        if (toIso) {
          matchesDate = matchesDate && targetIso <= toIso;
        }
      }

      return matchesSearch && matchesStatus && matchesRegistry && matchesDate;
    });

    // 4. Column Sorting Logic
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === 'patient_name') {
          const aName = (a.patient_name || '').toLowerCase();
          const bName = (b.patient_name || '').toLowerCase();
          return sortConfig.direction === 'asc'
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        }

        if (sortConfig.key === 'timeframe') {
          const aWeight = getIntervalWeight(a.timeframe);
          const bWeight = getIntervalWeight(b.timeframe);
          return sortConfig.direction === 'asc' ? aWeight - bWeight : bWeight - aWeight;
        }

        if (sortConfig.key === 'target_date') {
          const aTime = a.target_date ? new Date(a.target_date).getTime() : 0;
          const bTime = b.target_date ? new Date(b.target_date).getTime() : 0;
          return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
        }

        return 0;
      });
    }

    return result;
  }, [tasks, searchQuery, statusFilter, registryTypeFilter, fromDate, toDate, sortConfig]);

  // 5. Open Log Outreach Modal
  const handleOpenModal = (task) => {
    setSelectedTask(task);
    const loggedInNurse = getLoggedInNurseName();
    let initialNotes = task.nurse_notes || '';
    if (
      initialNotes.includes('[STEMI Detailed Follow-up]') ||
      initialNotes.includes('[NSTEMI Detailed Follow-up]') ||
      initialNotes.includes('[HF Detailed Follow-up]') ||
      initialNotes.includes('Detailed STEMI Form') ||
      initialNotes.includes('Detailed NSTEMI Form') ||
      initialNotes.includes('Detailed HF Form')
    ) {
      initialNotes = '';
    }
    let initialStatus = task.status || 'Pending Nurse Outreach';
    if (initialStatus === 'Required' || initialStatus === 'YES - Post-Discharge Visit Scheduled') {
      initialStatus = 'Pending Nurse Outreach';
    }
    setFormData({
      contact_mode: 'Phone Call',
      outcome: 'Patient Contacted & Appointment Confirmed',
      status: initialStatus,
      target_date: task.target_date ? String(task.target_date).split('T')[0] : '',
      symptoms_status: 'Stable - No worsening shortness of breath',
      medication_adherence: 'Compliant - Taking all meds as prescribed',
      assigned_nurse: loggedInNurse || task.assigned_nurse || '',
      notes: initialNotes
    });
    setIsModalOpen(true);
  };

  // 6. Submit Outreach Log to API
  const handleSubmitLog = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmitting(true);
    const regType = getTaskRegistryType(selectedTask);
    const payload = {
      is_standard_outreach: true,
      reg_patient_id: selectedTask.reg_patient_id,
      task_id: selectedTask.task_id,
      registry_type: regType,
      source_registry: selectedTask.source_registry,
      source_record_id: selectedTask.source_record_id,
      timeframe: selectedTask.timeframe,
      visit_mode: selectedTask.visit_mode,
      ...formData
    };

    try {
      let response;
      try {
        response = await api.post(`/nurse-dashboard/tasks/${selectedTask.task_id}/log`, payload);
      } catch (e1) {
        response = await api.post(`/nurse-followup-report/tasks/${selectedTask.task_id}/log`, payload);
      }

      if (response.data && response.data.success) {
        setIsModalOpen(false);
        await fetchTasks();
        const key = getUniqueKey(selectedTask);
        if (expandedRowKey === key) {
          await fetchPatientLogs(selectedTask.reg_patient_id, regType);
        }
      } else {
        throw new Error(response.data?.message || response.data?.error || 'Failed to save outreach record.');
      }
    } catch (err) {
      console.error('Error submitting outreach log for', selectedTask, err);
      const detailedError = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to record outreach log.';
      alert(`Outreach Save Error: ${detailedError}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Export CSV / Excel
  const handleExportCSV = () => {
    if (tasks.length === 0) return;
    const headers = ['Task ID', 'MRN', 'Patient Name', 'Gender', 'Age', 'Phone', 'Registry', 'Status', 'Target Date', 'Visit Mode', 'Assigned Nurse', 'Notes'];
    const rows = tasks.map((t) => [
      t.task_id,
      t.mr_no,
      `"${t.patient_name || ''}"`,
      t.gender || '',
      t.age || '',
      t.phone_no || '',
      t.source_registry || '',
      t.status || '',
      t.target_date ? String(t.target_date).split('T')[0] : '',
      `"${t.visit_mode || ''}"`,
      `"${t.assigned_nurse || ''}"`,
      `"${(t.nurse_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nurse_Followup_Report_${getLocalDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (rawStatus, task = {}) => {
    const status = (rawStatus || task?.overall_registry_status || task?.status || '').trim();
    const sLower = status.toLowerCase();

    if (sLower === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold rounded-lg text-[11px] border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Completed</span>
        </span>
      );
    }
    if (sLower === 'pending' || sLower === 'pending nurse outreach' || sLower === 'pending outreach') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold rounded-lg text-[11px] border border-amber-200 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending</span>
        </span>
      );
    }
    if (sLower === 'in progress' || sLower === 'in-progress' || sLower === 'inprogress') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-lg text-[11px] border border-blue-200 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>In Progress</span>
        </span>
      );
    }
    if (sLower === 'unable to contact' || sLower === 'patient unreachable') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold rounded-lg text-[11px] border border-slate-300 shadow-2xs">
          <X className="w-3.5 h-3.5 text-slate-600" />
          <span>Unable to Contact</span>
        </span>
      );
    }
    if (sLower === 'deceased') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 font-extrabold rounded-lg text-[11px] border border-rose-300 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
          <span>Deceased</span>
        </span>
      );
    }
    if (sLower === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg text-[11px] border border-indigo-200 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Scheduled</span>
        </span>
      );
    }
    if (sLower === 'required') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-lg text-[11px] border border-blue-200 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Required</span>
        </span>
      );
    }
    if (sLower === 'missed / overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold rounded-lg text-[11px] border border-amber-200 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Missed / Overdue</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-700 font-extrabold rounded-lg text-[11px] border border-slate-200 shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
        <span>{status || 'Pending'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Banner / Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-xl shadow-xs">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 text-white">
              <span>Patient Follow Up Report</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Post-discharge outreach tracking & clinical audit follow-up timeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Refresh Data from SQL Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={tasks.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Patients */}
        <div onClick={() => setStatusFilter('All')} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2 cursor-pointer hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-black uppercase tracking-wider">TOTAL PATIENTS</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{kpis.total}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">In active registry</span>
        </div>

        {/* Follow-up Required */}
        <div onClick={() => setStatusFilter('Required')} className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-blue-600 shadow-2xs space-y-2 cursor-pointer hover:border-blue-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-black uppercase tracking-wider">FOLLOW-UP REQUIRED</span>
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-black text-[10px] rounded border border-blue-200">
              {kpis.percentage}%
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-700">{kpis.required}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">Scheduled for clinic / telehealth</span>
        </div>

        {/* Pending Outreach */}
        <div onClick={() => setStatusFilter('Pending')} className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-amber-500 shadow-2xs space-y-2 cursor-pointer hover:border-amber-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-black uppercase tracking-wider">PENDING OUTREACH</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{kpis.pending}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">Requires nurse contact</span>
        </div>

        {/* Overdue / Action Needed */}
        <div onClick={() => setStatusFilter('Missed / Overdue')} className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-red-500 shadow-2xs space-y-2 cursor-pointer hover:border-red-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-black uppercase tracking-wider">OVERDUE / ACTION NEEDED</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-600">{kpis.overdue}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">Passed target timeframe</span>
        </div>

        {/* Completed */}
        <div onClick={() => setStatusFilter('Completed')} className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs space-y-2 cursor-pointer hover:border-teal-300 transition-all">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[11px] font-black uppercase tracking-wider">COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-teal-700">{kpis.completed}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">Successfully contacted</span>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Search Patient Name or MRN */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              SEARCH PATIENT NAME OR MRN
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type patient name or MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Registry Pathway Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              REGISTRY PATHWAY
            </label>
            <div className="relative">
              <select
                value={registryTypeFilter}
                onChange={(e) => setRegistryTypeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer appearance-none pr-8"
              >
                <option value="All">All Registries</option>
                <option value="STEMI">STEMI Registry</option>
                <option value="NSTEMI">NSTEMI Registry</option>
                <option value="HF">Heart Failure (HF)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Overall Registry Status Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              OVERALL REGISTRY STATUS
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer appearance-none pr-8"
              >
                {OVERALL_REGISTRY_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status === 'All (Default)' ? 'All' : status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Follow-up From Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              FOLLOW-UP FROM DATE
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pr-9"
              />
              <input
                type="date"
                id="from-date-picker"
                onChange={(e) => {
                  if (e.target.value) {
                    setFromDate(toDDMMYYYY(e.target.value));
                  }
                }}
                className="absolute right-2.5 opacity-0 w-5 h-5 cursor-pointer z-10"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>

          {/* Follow-up To Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              FOLLOW-UP TO DATE
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all pr-9"
              />
              <input
                type="date"
                id="to-date-picker"
                onChange={(e) => {
                  if (e.target.value) {
                    setToDate(toDDMMYYYY(e.target.value));
                  }
                }}
                className="absolute right-2.5 opacity-0 w-5 h-5 cursor-pointer z-10"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-900">{filteredTasks.length}</strong> of{' '}
            <strong className="text-slate-900">{tasks.length}</strong> patient records
          </span>
          {(searchQuery || statusFilter !== 'All' || registryTypeFilter !== 'All' || fromDate || toDate || sortConfig.key) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setRegistryTypeFilter('All');
                setFromDate('');
                setToDate('');
                setSortConfig({ key: null, direction: 'asc' });
              }}
              className="text-blue-600 hover:text-blue-800 font-bold text-xs cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-semibold space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-sm">Loading nurse follow-up registry records from SQL Server...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No follow-up records found in SQL database.</p>
            <p className="text-xs text-slate-400">
              {tasks.length === 0
                ? 'The patient_followup_tasks table is currently empty.'
                : 'No records match your active search filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider select-none">
                  <th
                    onClick={() => handleSort('patient_name')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
                    title="Click to sort by Patient Name"
                  >
                    <div className="flex items-center">
                      <span>PATIENT & DEMOGRAPHICS</span>
                      {renderSortIcon('patient_name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('timeframe')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
                    title="Click to sort by Follow-Up Interval"
                  >
                    <div className="flex items-center">
                      <span>FOLLOW-UP</span>
                      {renderSortIcon('timeframe')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('target_date')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group"
                    title="Click to sort by Target Date"
                  >
                    <div className="flex items-center">
                      <span>TARGET DATE & VISIT MODE</span>
                      {renderSortIcon('target_date')}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">PRE-VISIT DIAGNOSTICS</th>
                  <th className="py-3.5 px-4">INSTRUCTIONS TO PATIENT/CAREGIVER</th>
                  <th className="py-3.5 px-4 text-right">NURSE ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredTasks.map((task) => {
                  const uniqueKey = getUniqueKey(task);
                  const isExpanded = expandedRowKey === uniqueKey;
                  const formattedDate = formatDate(task.target_date);

                  // Flexible boolean/bit evaluator for SQL fields
                  const isTrue = (val) => val === 1 || val === '1' || val === true || val === 'true' || val === 'Yes';

                  // Dynamic extraction of pre-visit diagnostics from DB fields (only for HF / registries with pre-visit investigations)
                  const diagnostics = [];
                  if (task.registry_type !== 'NSTEMI') {
                    if (isTrue(task.investigation_serum_lytes) || isTrue(task.investigation_electrolytes_creatinine)) {
                      diagnostics.push('Serum Potassium & Creatinine');
                    }
                    if (isTrue(task.investigation_bnp_ntprobnp) || isTrue(task.investigation_bnp)) {
                      diagnostics.push('NT-proBNP / BNP');
                    }
                    if (isTrue(task.investigation_echo) || isTrue(task.investigation_repeat_echo)) {
                      diagnostics.push('Repeat Echo');
                    }
                    if (isTrue(task.investigation_ecg) || isTrue(task.investigation_12lead_ecg)) {
                      diagnostics.push('12-Lead ECG');
                    }
                    if (isTrue(task.investigation_6mw_test) || isTrue(task.investigation_6mwt)) {
                      diagnostics.push('6-MWT');
                    }
                  }

                  const rowKey = task.task_id ? `task-row-${task.task_id}` : `patient-row-${task.reg_patient_id || task.mr_no}`;

                  return (
                    <React.Fragment key={`frag-${rowKey}`}>
                      <tr key={rowKey} className="border-b border-slate-200 hover:bg-slate-50/80 transition-colors">
                        {/* 1. Patient & Demographics */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <div className="font-black text-slate-900 text-sm">
                              {task.patient_name || 'Unknown Patient'}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px]">
                              <span>{task.gender || 'N/A'}</span>
                              <span>•</span>
                              <span>{task.age ? `${task.age} Yrs` : 'N/A'}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded border border-blue-200">
                                MRN: {task.mr_no || 'N/A'}
                              </span>
                            </div>
                            {task.phone_no && (
                              <div className="flex items-center gap-1 text-slate-500 font-bold text-[11px] pt-0.5">
                                <PhoneCall className="w-3 h-3 text-slate-400" />
                                <span>{task.phone_no}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 2. Follow-Up Status */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1.5">
                            {getStatusBadge(task.overall_registry_status || task.status, task)}
                            <div className="flex items-center gap-1 text-slate-500 font-bold text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{task.timeframe || '1-Month'}</span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Target Date & Visit Mode */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <div className="font-extrabold text-slate-900 text-xs">
                              {formattedDate}
                            </div>
                            <div className="text-slate-600 font-bold text-[11px]">
                              {task.visit_mode || 'In-Person Clinic Visit'}
                            </div>
                            <div className="pt-0.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase ${
                                (task.registry_type || task.source_registry) === 'NSTEMI'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : (task.registry_type || task.source_registry) === 'STEMI'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {task.registry_type || task.source_registry || 'HF'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 4. Pre-Visit Diagnostics */}
                        <td className="py-4 px-4 align-top">
                          {diagnostics.length === 0 ? (
                            <span className="text-slate-400 font-semibold italic text-[11px]">
                              None Requested
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {diagnostics.map((diag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-700 font-extrabold rounded text-[10px] border border-slate-200 flex items-center gap-1 shadow-2xs"
                                >
                                  <Activity className="w-2.5 h-2.5 text-blue-600" />
                                  {diag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 5. Instructions to Patient/Caregiver */}
                        <td className="py-4 px-4 align-top max-w-[280px]">
                          <div className="space-y-1">
                            {task.source_registry && (
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px] border border-slate-200">
                                {task.source_registry}
                              </span>
                            )}
                            <p className="text-slate-700 text-xs leading-relaxed font-semibold line-clamp-3">
                              {task.special_instructions || task.self_care_instructions || 'Standard post-discharge monitoring.'}
                            </p>
                          </div>
                        </td>

                        {/* 6. Nurse Actions */}
                        <td className="py-4 px-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {(getTaskRegistryType(task) === 'HF' || (task.source_registry || '').toLowerCase().includes('heart failure')) && (
                              <button
                                onClick={() => handleOpenHfModal(task)}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                title="Fill Detailed Heart Failure Follow-up Form"
                              >
                                <Stethoscope className="w-3.5 h-3.5 text-teal-200" />
                                <span>Log Detailed HF Follow-up</span>
                              </button>
                            )}

                            {(getTaskRegistryType(task) === 'STEMI' || ((task.source_registry || '').toLowerCase().includes('stemi') && !(task.source_registry || '').toLowerCase().includes('nstemi'))) && (
                              <button
                                onClick={() => handleOpenStemiModal(task)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                title="Fill Detailed STEMI Follow-up Form"
                              >
                                <Stethoscope className="w-3.5 h-3.5 text-red-200" />
                                <span>Log Detailed STEMI Follow-up</span>
                              </button>
                            )}

                            {(getTaskRegistryType(task) === 'NSTEMI' || (task.source_registry || '').toLowerCase().includes('nstemi')) && (
                              <button
                                onClick={() => handleOpenNstemiModal(task)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                title="Fill Detailed NSTEMI Follow-up Form"
                              >
                                <Stethoscope className="w-3.5 h-3.5 text-amber-200" />
                                <span>Log Detailed NSTEMI Follow-up</span>
                              </button>
                            )}

                            <button
                              onClick={() => toggleExpandRow(task)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                              title={isExpanded ? 'Collapse Details' : 'Expand Details'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Audit Details & Outreach Timeline Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={6} className="p-4 md:p-6">
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6">
                              {/* Section Title */}
                              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <ClipboardList className="w-5 h-5 text-blue-600" />
                                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                     PATIENT FOLLOW-UP & CONSOLIDATED HISTORY AUDIT
                                  </h3>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400">
                                  Patient ID: #{task.reg_patient_id} • Latest Task ID: #{task.task_id}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Sub-Card: Clinical Assessment Audit Info */}
                                <div className="lg:col-span-6 space-y-4">
                                  <div>
                                    <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                                      IS FOLLOW-UP REQUIRED FOR THIS PATIENT?
                                    </span>
                                    <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-black text-xs inline-block">
                                      {task.status || 'YES - Post-Discharge Visit Scheduled'}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <div>
                                      <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                        TIMEFRAME / URGENCY:
                                      </span>
                                      <span className="text-xs font-black text-slate-800 block mt-0.5">
                                        {task.timeframe || '1-Month'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                        TARGET VISIT DATE:
                                      </span>
                                      <span className="text-xs font-black text-slate-800 block mt-0.5">
                                        {formattedDate}
                                      </span>
                                    </div>
                                  </div>

                                  {task.primary_followup_reason && (
                                    <div className="space-y-1">
                                      <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                        PRIMARY CLINICAL REASON FOR FOLLOW-UP:
                                      </span>
                                      <span className="text-xs font-bold text-slate-800 block">
                                        {task.primary_followup_reason}
                                      </span>
                                    </div>
                                  )}

                                  {task.primary_no_followup_reason && (
                                    <div className="space-y-1">
                                      <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider text-rose-600">
                                        NO FOLLOW-UP REASON (IF APPLICABLE):
                                      </span>
                                      <span className="text-xs font-bold text-slate-800 block">
                                        {task.primary_no_followup_reason}
                                      </span>
                                    </div>
                                  )}

                                  <div className="space-y-1">
                                    <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                      CLINICAL SPECIAL INSTRUCTIONS / SUMMARY:
                                    </span>
                                    <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                                      {task.special_instructions || task.self_care_instructions || 'Standard post-discharge heart failure follow-up monitoring.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Right Sub-Card: Consolidated Patient History & Outreach Timeline */}
                                <div className="lg:col-span-6 space-y-4 border-l border-slate-200 pl-0 lg:pl-6">
                                  <div>
                                    <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                                      MOST RECENT NURSE OUTREACH SUMMARY
                                    </span>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                                      <div className="flex justify-between items-center text-slate-600 font-semibold">
                                        <span>Assigned Nurse: <strong className="text-slate-800">{task.assigned_nurse || 'Unassigned'}</strong></span>
                                        <span>Last Contact: <strong className="text-slate-800">{
                                           (() => {
                                             const logs = patientLogs[uniqueKey] || [];
                                             const latestLog = logs[0];
                                             if (latestLog && (latestLog.created_at || latestLog.contact_date)) {
                                               return formatDateTime(latestLog.created_at || latestLog.contact_date);
                                             }
                                             return task.last_contact_date ? formatDate(task.last_contact_date) : 'None Recorded';
                                           })()
                                         }</strong></span>
                                      </div>
                                      {task.nurse_notes && task.nurse_notes.includes('[HF Detailed Follow-up]') ? (
                                        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                              <span className="px-2 py-0.5 bg-teal-600 text-white rounded font-extrabold text-[10px] uppercase tracking-wider">
                                                Detailed HF Form
                                              </span>
                                              <span className="text-xs font-black text-teal-900">
                                                Detailed 7-Section HF Clinical Assessment Response Recorded
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const matchingLog = (patientLogs[uniqueKey] || []).find((l) => l.notes?.includes('[HF Detailed Follow-up]'));
                                                openPdfModal(matchingLog || { notes: task.nurse_notes }, task);
                                              }}
                                              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                                            >
                                              <FileText className="w-4 h-4" />
                                              <span>View PDF Response</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : task.nurse_notes && (task.nurse_notes.includes('[STEMI Detailed Follow-up]') || task.nurse_notes.includes('Detailed STEMI Form')) ? (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                              <span className="px-2 py-0.5 bg-red-600 text-white rounded font-extrabold text-[10px] uppercase tracking-wider">
                                                Detailed STEMI Form
                                              </span>
                                              <span className="text-xs font-black text-red-900">
                                                Detailed STEMI Follow-Up Response Recorded
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const matchingLog = (patientLogs[uniqueKey] || []).find((l) => l.notes?.includes('[STEMI Detailed Follow-up]') || l.outcome?.includes('STEMI'));
                                                openAcsPdfModal(matchingLog || { notes: task.nurse_notes }, task, 'STEMI');
                                              }}
                                              className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                                            >
                                              <FileText className="w-4 h-4" />
                                              <span>View PDF Response</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : task.nurse_notes && (task.nurse_notes.includes('[NSTEMI Detailed Follow-up]') || task.nurse_notes.includes('Detailed NSTEMI Form')) ? (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                                          <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                              <span className="px-2 py-0.5 bg-amber-600 text-white rounded font-extrabold text-[10px] uppercase tracking-wider">
                                                Detailed NSTEMI Form
                                              </span>
                                              <span className="text-xs font-black text-amber-900">
                                                Detailed NSTEMI Follow-Up Response Recorded
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const matchingLog = (patientLogs[uniqueKey] || []).find((l) => l.notes?.includes('[NSTEMI Detailed Follow-up]') || l.outcome?.includes('NSTEMI'));
                                                openAcsPdfModal(matchingLog || { notes: task.nurse_notes }, task, 'NSTEMI');
                                              }}
                                              className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                                            >
                                              <FileText className="w-4 h-4" />
                                              <span>View PDF Response</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                                          "{task.nurse_notes || 'No outreach notes recorded yet.'}"
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Consolidated Patient Outreach Timeline Logs List */}
                                  <div className="pt-2 border-t border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                                        NURSE OUTREACH TIMELINE & CALL HISTORY
                                      </span>
                                      {(patientLogs[uniqueKey] || []).length > 0 && (
                                        <span className="text-[10px] font-bold text-slate-400">
                                          {(patientLogs[uniqueKey] || []).length} Total Log{(patientLogs[uniqueKey] || []).length !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>

                                    {logsLoading ? (
                                      <p className="text-[11px] text-slate-400 animate-pulse">Loading patient outreach logs...</p>
                                    ) : (patientLogs[uniqueKey] || []).length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">No prior nurse outreach logs recorded for this registry pathway.</p>
                                    ) : (() => {
                                      const { currentEpisode, historicalEpisodes } = groupLogsByEpisode(patientLogs[uniqueKey] || []);
                                      const isHistoryOpen = expandedHistoryKeys[uniqueKey] ?? false;
                                      const totalHistoricalLogs = historicalEpisodes.reduce((acc, ep) => acc + ep.logs.length, 0);

                                      const renderLogCard = (log, index, isCurrent) => {
                                        const episodeTag = log.episode_id || (log.registry_id ? `${log.registry_type || 'HF'}-${String(log.registry_id).padStart(2, '0')}` : 'Episode');
                                        const statusText = log.episode_status || 'Completed';
                                        const isStandardOutreach = log.log_type === 'standard_outreach' || log.log_type === 'Manual Outreach Log' || log.outcome === 'Patient Contacted & Appointment Confirmed';
                                        const isHfDetailed = !isStandardOutreach && (log.log_type === 'detailed_hf_log' || Boolean(log.notes && log.notes.includes('[HF Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed HF Form')) && !log.notes?.includes('[STEMI Detailed') && !log.notes?.includes('[NSTEMI Detailed')));
                                        const isStemiDetailed = !isStandardOutreach && (log.log_type === 'detailed_stemi_log' || Boolean(log.notes && log.notes.includes('[STEMI Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed STEMI Form')) && !log.notes?.includes('[HF Detailed') && !log.notes?.includes('[NSTEMI Detailed')));
                                        const isNstemiDetailed = !isStandardOutreach && (log.log_type === 'detailed_nstemi_log' || Boolean(log.notes && log.notes.includes('[NSTEMI Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed NSTEMI Form')) && !log.notes?.includes('[HF Detailed') && !log.notes?.includes('[STEMI Detailed')));
                                        const isDetailedForm = (isHfDetailed || isStemiDetailed || isNstemiDetailed) && !isStandardOutreach;

                                        return (
                                          <div
                                            key={log.log_id || index}
                                            className={`p-3.5 rounded-xl border text-[11px] space-y-2.5 transition-all ${
                                              isHfDetailed
                                                ? 'bg-teal-50/60 border-teal-200 shadow-2xs hover:border-teal-300'
                                                : isStemiDetailed
                                                ? 'bg-red-50/60 border-red-200 shadow-2xs hover:border-red-300'
                                                : isNstemiDetailed
                                                ? 'bg-amber-50/60 border-amber-200 shadow-2xs hover:border-amber-300'
                                                : isCurrent
                                                ? 'bg-white border-blue-200/90 shadow-2xs hover:border-blue-300'
                                                : 'bg-slate-50/90 border-slate-200 text-slate-700 hover:border-slate-300'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between font-bold text-slate-800 flex-wrap gap-1">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                {/* Contact Mode Badge */}
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                                  isHfDetailed ? 'bg-teal-600 text-white border-teal-700' :
                                                  isStemiDetailed ? 'bg-red-600 text-white border-red-700' :
                                                  isNstemiDetailed ? 'bg-amber-600 text-white border-amber-700' :
                                                  'bg-blue-100 text-blue-800 border-blue-300'
                                                }`}>
                                                  {isHfDetailed ? 'DETAILED HF FORM' :
                                                   isStemiDetailed ? 'DETAILED STEMI FORM' :
                                                   isNstemiDetailed ? 'DETAILED NSTEMI FORM' :
                                                   (log.contact_mode || 'PHONE CALL')}
                                                </span>

                                                {/* Episode ID & Status Badge */}
                                                <span
                                                  className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border flex items-center gap-1 ${
                                                    isCurrent
                                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                      : 'bg-slate-200 text-slate-700 border-slate-300'
                                                  }`}
                                                >
                                                  <span>{episodeTag} | {statusText}</span>
                                                </span>

                                                <span className="text-slate-700 font-semibold">{log.nurse_name || 'Staff Nurse'}</span>
                                              </div>

                                              {/* Timestamp in Indian Format */}
                                              <span className="text-slate-400 font-semibold text-[10px] font-mono">
                                                {log.contact_date ? formatDateTime(log.created_at || log.contact_date) : ''}
                                              </span>
                                            </div>

                                            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                                              <div className={`font-black text-xs ${
                                                isHfDetailed ? 'text-teal-900' :
                                                isStemiDetailed ? 'text-red-900' :
                                                isNstemiDetailed ? 'text-amber-900' :
                                                isCurrent ? 'text-blue-700' : 'text-slate-800'
                                              }`}>
                                                {log.outcome}
                                              </div>

                                              {isHfDetailed && (
                                                <button
                                                  type="button"
                                                  onClick={() => openPdfModal(log, task)}
                                                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                  title="View Heart Failure follow-up PDF report"
                                                >
                                                  <FileText className="w-4 h-4" />
                                                  <span>View PDF Response</span>
                                                </button>
                                              )}

                                              {isStemiDetailed && (
                                                <button
                                                  type="button"
                                                  onClick={() => openAcsPdfModal(log, task, 'STEMI')}
                                                  className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                  title="View STEMI follow-up PDF report"
                                                >
                                                  <FileText className="w-4 h-4" />
                                                  <span>View PDF Response</span>
                                                </button>
                                              )}

                                              {isNstemiDetailed && (
                                                <button
                                                  type="button"
                                                  onClick={() => openAcsPdfModal(log, task, 'NSTEMI')}
                                                  className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                  title="View NSTEMI follow-up PDF report"
                                                >
                                                  <FileText className="w-4 h-4" />
                                                  <span>View PDF Response</span>
                                                </button>
                                              )}
                                            </div>

                                            {log.symptoms_status && log.symptoms_status !== 'N/A' && !isDetailedForm && (
                                              <div className="text-slate-600 text-[10px] flex items-center gap-1">
                                                <span className="font-bold text-slate-500">Symptoms:</span> {log.symptoms_status}
                                              </div>
                                            )}

                                            {log.notes && !isDetailedForm && (
                                              <div className="text-slate-600 text-[11px] leading-relaxed p-2 rounded-lg border bg-white/80 border-slate-200/80">
                                                {log.notes}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      };

                                      return (
                                        <div className="space-y-3">
                                          {/* Section 1: Current Episode (Active Admission) */}
                                          {currentEpisode && (
                                            <div className="border-2 border-blue-400/80 bg-blue-50/20 rounded-xl p-3 space-y-2.5 shadow-2xs">
                                              <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/60">
                                                <div className="flex items-center gap-2">
                                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                                    Current Episode: {currentEpisode.episodeId}
                                                  </span>
                                                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                    {currentEpisode.status || 'Active'}
                                                  </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full border border-blue-200">
                                                  {currentEpisode.logs.length} Recent Log{currentEpisode.logs.length !== 1 ? 's' : ''}
                                                </span>
                                              </div>

                                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                                {currentEpisode.logs.map((log, index) => renderLogCard(log, index, true))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Section 2: Previous Episodes (Collapsible Muted Accordion) */}
                                          {historicalEpisodes.length > 0 && (
                                            <div className="border border-slate-200/90 bg-slate-50/80 rounded-xl overflow-hidden shadow-2xs">
                                              <button
                                                type="button"
                                                onClick={() => toggleHistoricalLogs(uniqueKey)}
                                                className="w-full flex items-center justify-between p-2.5 bg-slate-100/90 hover:bg-slate-200/80 text-left transition-colors cursor-pointer"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                  <span className="text-xs font-bold text-slate-700">
                                                    Previous Admission Logs
                                                  </span>
                                                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 border border-slate-300 text-[9px] font-extrabold rounded-full">
                                                    {totalHistoricalLogs} Log{totalHistoricalLogs !== 1 ? 's' : ''} across {historicalEpisodes.length} Past Episode{historicalEpisodes.length !== 1 ? 's' : ''}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                                                  <span>{isHistoryOpen ? 'Hide Past Episodes' : 'Show Past Episodes'}</span>
                                                  {isHistoryOpen ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                                </div>
                                              </button>

                                              {isHistoryOpen && (
                                                <div className="p-3 space-y-3 max-h-60 overflow-y-auto border-t border-slate-200 divide-y divide-slate-200/60">
                                                  {historicalEpisodes.map((episodeGroup) => (
                                                    <div key={episodeGroup.key} className="pt-2.5 first:pt-0 space-y-2">
                                                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                          <span className="text-slate-400 font-normal">📁</span>
                                                          <span className="text-slate-800 font-extrabold">Episode {episodeGroup.episodeId}</span>
                                                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-slate-200 text-slate-700 border border-slate-300">
                                                            {episodeGroup.status || 'Completed'}
                                                          </span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                          {episodeGroup.logs.length} Log{episodeGroup.logs.length !== 1 ? 's' : ''}
                                                        </span>
                                                      </div>

                                                      <div className="space-y-1.5 pl-2 border-l-2 border-slate-300/70">
                                                        {episodeGroup.logs.map((log, index) => renderLogCard(log, index, false))}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Outreach Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-visible border border-slate-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 md:p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Nurse Outreach Call Log</h3>
                  <p className="text-xs text-slate-300 font-semibold">
                    {selectedTask.patient_name} • MRN: {selectedTask.mr_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitLog} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Mode */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-700">
                    Offline Contact Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.contact_mode}
                    onChange={(e) => setFormData({ ...formData, contact_mode: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="Phone Call">Phone Call</option>
                    <option value="In-Person Visit">In-Person Visit</option>
                    <option value="WhatsApp / SMS">WhatsApp / SMS</option>
                    <option value="Telehealth Video">Telehealth Video</option>
                  </select>
                </div>

                {/* Outreach Outcome */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-700">
                    Outreach Outcome <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="Patient Contacted & Appointment Confirmed">Patient Contacted & Appointment Confirmed</option>
                    <option value="Patient Contacted & Tele-Consult Conducted">Patient Contacted & Tele-Consult Conducted</option>
                    <option value="Patient Contacted & Rescheduled">Patient Contacted & Rescheduled</option>
                    <option value="Unreachable - Left Voicemail / SMS">Unreachable - Left Voicemail / SMS</option>
                    <option value="Patient Refused / Preferred Local Doctor">Patient Refused / Preferred Local Doctor</option>
                    <option value="Escalated to Cardiologist - Red Flags Detected">Escalated to Cardiologist - Red Flags Detected</option>
                    <option value="Home Health Visit Completed">Home Health Visit Completed</option>
                  </select>
                </div>

                {/* Overall Registry Status */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-700">
                    Overall Registry Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="Pending Nurse Outreach">Pending Nurse Outreach</option>
                    <option value="Required">Required / Action Needed</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Missed / Overdue">Missed / Overdue</option>
                    <option value="Patient Unreachable">Patient Unreachable</option>
                    <option value="Escalated to Cardiologist">Escalated to Cardiologist</option>
                  </select>
                </div>

                {/* Target Follow-Up Visit Date */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-700">
                    Target Follow-Up Visit Date
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Symptom Status */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-700">
                    Symptom Status / Red Flags Check
                  </label>
                  <select
                    value={formData.symptoms_status}
                    onChange={(e) => setFormData({ ...formData, symptoms_status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Stable - No worsening shortness of breath">Stable - No worsening shortness of breath</option>
                    <option value="Mild Symptoms - Monitored">Mild Symptoms - Monitored</option>
                    <option value="Severe Symptoms / Emergency">Severe Symptoms / Emergency</option>
                  </select>
                </div>

                {/* Medication Adherence */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-700">
                    Medication Adherence
                  </label>
                  <select
                    value={formData.medication_adherence}
                    onChange={(e) => setFormData({ ...formData, medication_adherence: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Compliant - Taking all meds as prescribed">Compliant - Taking all meds as prescribed</option>
                    <option value="Partial Adherence">Partial Adherence</option>
                    <option value="Non-Compliant / Side Effects">Non-Compliant / Side Effects</option>
                  </select>
                </div>
              </div>

              {/* Assigned Nurse Name */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-black text-slate-700">
                    Assigned Nurse Name <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] select-none ${
                    Math.max(0, 100 - (formData.assigned_nurse || '').length) <= 5
                      ? 'text-rose-500 font-bold animate-pulse'
                      : 'text-slate-400 font-medium'
                  }`}>
                    {Math.max(0, 100 - (formData.assigned_nurse || '').length)} left
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={formData.assigned_nurse || ''}
                  onChange={(e) => setFormData({ ...formData, assigned_nurse: e.target.value.slice(0, 100) })}
                  placeholder="e.g. Nurse Anitha R., RN"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Offline Outreach Log Notes */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-black text-slate-700">
                    Offline Outreach Log Notes / Detailed Feedback <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] select-none ${
                    Math.max(0, 1000 - (formData.notes || '').length) <= 5
                      ? 'text-rose-500 font-bold animate-pulse'
                      : 'text-slate-400 font-medium'
                  }`}>
                    {Math.max(0, 1000 - (formData.notes || '').length)} left
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 1000) })}
                  placeholder="Record patient response, weight measurement notes, medication titration feedback..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                  required
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Save Outreach Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Detailed HF Follow-up Modal Dialog */}
      {isHfModalOpen && selectedHfTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-[1440px] mx-auto my-auto flex justify-center">
            <HFFollowUpForm
              patientData={selectedHfTask}
              taskData={selectedHfTask}
              onSave={handleSaveHfFollowup}
              onCancel={() => {
                setIsHfModalOpen(false);
                setSelectedHfTask(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Log Detailed STEMI Follow-up Modal Dialog */}
      {isStemiModalOpen && selectedStemiTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-[1440px] mx-auto my-auto flex justify-center">
            <StemiFollowUpForm
              patientData={selectedStemiTask}
              taskData={selectedStemiTask}
              onSave={(payload) => handleSaveAcsFollowup(payload, 'STEMI')}
              onCancel={() => {
                setIsStemiModalOpen(false);
                setSelectedStemiTask(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Log Detailed NSTEMI Follow-up Modal Dialog */}
      {isNstemiModalOpen && selectedNstemiTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-[1440px] mx-auto my-auto flex justify-center">
            <NstemiFollowUpForm
              patientData={selectedNstemiTask}
              taskData={selectedNstemiTask}
              onSave={(payload) => handleSaveAcsFollowup(payload, 'NSTEMI')}
              onCancel={() => {
                setIsNstemiModalOpen(false);
                setSelectedNstemiTask(null);
              }}
            />
          </div>
        </div>
      )}

      {/* In-App Live HF PDF Response View Modal */}
      <HfFollowupPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setPdfModalLog(null);
          setPdfModalTask(null);
        }}
        logData={pdfModalLog}
        patientData={pdfModalTask}
      />

      {/* In-App Live STEMI & NSTEMI ACS PDF Response View Modal */}
      <AcsFollowupPdfModal
        isOpen={isAcsPdfModalOpen}
        onClose={() => {
          setIsAcsPdfModalOpen(false);
          setAcsPdfModalLog(null);
          setAcsPdfModalTask(null);
        }}
        logData={acsPdfModalLog}
        patientData={acsPdfModalTask}
        registryType={acsPdfModalType}
      />
    </div>
  );
}
