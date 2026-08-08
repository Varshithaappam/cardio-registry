import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
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
  RefreshCw
} from 'lucide-react';

export default function NurseFollowUpReport() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Expanded Row State (Task ID)
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [taskLogs, setTaskLogs] = useState({});
  const [logsLoading, setLogsLoading] = useState(false);

  // Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // 1. Fetch Tasks strictly from SQL Database (No Mock Fallback)
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      try {
        response = await api.get('/nurse-dashboard/tasks');
      } catch (e1) {
        response = await api.get('/nurse-followup-report/tasks');
      }
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

  // 2. Fetch Task Logs on Expand strictly from SQL Database
  const fetchTaskLogs = async (taskId) => {
    setLogsLoading(true);
    try {
      let response;
      try {
        response = await api.get(`/nurse-dashboard/tasks/${taskId}/logs`);
      } catch (e1) {
        response = await api.get(`/nurse-followup-report/tasks/${taskId}/logs`);
      }
      if (response.data && response.data.success) {
        setTaskLogs((prev) => ({ ...prev, [taskId]: response.data.data || [] }));
      } else {
        setTaskLogs((prev) => ({ ...prev, [taskId]: [] }));
      }
    } catch (err) {
      console.error(`Error fetching logs for task ${taskId}:`, err);
      setTaskLogs((prev) => ({ ...prev, [taskId]: [] }));
    } finally {
      setLogsLoading(false);
    }
  };

  const toggleExpandRow = (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      if (!taskLogs[taskId]) {
        fetchTaskLogs(taskId);
      }
    }
  };

  // 3. Dynamic KPI Calculations strictly from fetched state
  const kpis = useMemo(() => {
    const total = tasks.length;
    const required = tasks.filter((t) => t.status === 'Required' || t.status === 'Scheduled' || t.status === 'Follow-Up Scheduled').length;
    const pending = tasks.filter((t) => t.status === 'Pending Nurse Outreach' || t.status === 'Pending').length;
    
    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter((t) => (t.target_date && t.target_date < today) || t.status === 'Missed / Overdue' || t.status === 'Overdue / Urgent Action').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const percentage = total > 0 ? Math.round((required / total) * 100) : 0;

    return { total, required, percentage, pending, overdue, completed };
  }, [tasks]);

  // 4. Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = task.patient_name?.toLowerCase().includes(q);
      const mrnMatch = task.mr_no?.toLowerCase().includes(q);
      const phoneMatch = task.phone_no?.includes(q);
      const matchesSearch = !q || nameMatch || mrnMatch || phoneMatch;

      let matchesDate = true;
      if (fromDate && task.target_date) {
        matchesDate = matchesDate && task.target_date >= fromDate;
      }
      if (toDate && task.target_date) {
        matchesDate = matchesDate && task.target_date <= toDate;
      }

      return matchesSearch && matchesDate;
    });
  }, [tasks, searchQuery, fromDate, toDate]);

  // 5. Open Log Outreach Modal
  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setFormData({
      contact_mode: 'Phone Call',
      outcome: 'Patient Contacted & Appointment Confirmed',
      status: task.status || 'Pending Nurse Outreach',
      target_date: task.target_date ? String(task.target_date).split('T')[0] : '',
      symptoms_status: 'Stable - No worsening shortness of breath',
      medication_adherence: 'Compliant - Taking all meds as prescribed',
      assigned_nurse: task.assigned_nurse || '',
      notes: task.nurse_notes || ''
    });
    setIsModalOpen(true);
  };

  // 6. Submit Outreach Log to API
  const handleSubmitLog = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmitting(true);
    try {
      let response;
      try {
        response = await api.post(`/nurse-dashboard/tasks/${selectedTask.task_id}/log`, {
          patient_id: selectedTask.patient_id,
          ...formData
        });
      } catch (e1) {
        response = await api.post(`/nurse-followup-report/tasks/${selectedTask.task_id}/log`, {
          patient_id: selectedTask.patient_id,
          ...formData
        });
      }

      if (response.data && response.data.success) {
        setIsModalOpen(false);
        await fetchTasks();
        if (expandedTaskId === selectedTask.task_id) {
          await fetchTaskLogs(selectedTask.task_id);
        }
      }
    } catch (err) {
      console.error('Error submitting outreach log:', err);
      alert(err.response?.data?.message || 'Failed to submit outreach log.');
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
    link.setAttribute('download', `Nurse_Followup_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-blue-600 shadow-2xs space-y-2">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-amber-500 shadow-2xs space-y-2">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-red-500 shadow-2xs space-y-2">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs space-y-2">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Search Patient Name or MRN */}
          <div className="space-y-1.5 md:col-span-1">
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

          {/* Follow-up From Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              FOLLOW-UP FROM DATE
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Follow-up To Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              FOLLOW-UP TO DATE
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500 font-semibold pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-900">{filteredTasks.length}</strong> of{' '}
            <strong className="text-slate-900">{tasks.length}</strong> patient records
          </span>
          {(searchQuery || fromDate || toDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFromDate('');
                setToDate('');
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
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">PATIENT & DEMOGRAPHICS</th>
                  <th className="py-3.5 px-4">FOLLOW-UP</th>
                  <th className="py-3.5 px-4">TARGET DATE & VISIT MODE</th>
                  <th className="py-3.5 px-4">PRE-VISIT DIAGNOSTICS</th>
                  <th className="py-3.5 px-4">INSTRUCTIONS TO PATIENT/CAREGIVER</th>
                  <th className="py-3.5 px-4 text-right">NURSE ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-xs">
                {filteredTasks.map((task) => {
                  const isExpanded = expandedTaskId === task.task_id;
                  const formattedDate = task.target_date ? String(task.target_date).split('T')[0] : 'N/A';

                  // Flexible boolean/bit evaluator for SQL fields
                  const isTrue = (val) => val === 1 || val === '1' || val === true || val === 'true' || val === 'Yes';

                  // Dynamic extraction of pre-visit diagnostics from DB fields
                  const diagnostics = [];
                  if (isTrue(task.investigation_serum_lytes) || isTrue(task.investigation_electrolytes_creatinine)) {
                    diagnostics.push('Serum Potassium & Creatinine');
                  }
                  if (isTrue(task.investigation_bnp_ntprobnp) || isTrue(task.investigation_bnp)) {
                    diagnostics.push('NT-proBNP / BNP');
                  }
                  if (isTrue(task.investigation_echo) || isTrue(task.investigation_echocardiogram)) {
                    diagnostics.push('Repeat Echo');
                  }
                  if (isTrue(task.investigation_ecg)) {
                    diagnostics.push('12-Lead ECG');
                  }
                  if (isTrue(task.investigation_6mw_test) || isTrue(task.investigation_6mwt)) {
                    diagnostics.push('6-MWT');
                  }

                  if (Array.isArray(task.pre_visit_diagnostics)) {
                    task.pre_visit_diagnostics.forEach(d => {
                      if (!diagnostics.includes(d)) diagnostics.push(d);
                    });
                  }

                  return (
                    <React.Fragment key={task.task_id}>
                      <tr className={`hover:bg-slate-50/60 transition-colors ${isExpanded ? 'bg-slate-50/90' : ''}`}>
                        {/* 1. Patient & Demographics */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <h4 className="font-black text-slate-900 text-sm leading-snug">
                              {task.patient_name || 'N/A'}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap font-semibold">
                              <span>{task.gender || 'N/A'}</span>
                              <span>•</span>
                              <span>{task.age !== null && task.age !== undefined ? `${task.age} Yrs` : 'N/A'}</span>
                              <span>•</span>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-black text-[10px] border border-blue-200">
                                MRN: {task.mr_no || 'N/A'}
                              </span>
                            </div>
                            {task.phone_no && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold pt-0.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{task.phone_no}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 2. Follow-Up Status */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-black rounded-lg text-[11px] border border-blue-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>{task.status || 'Required'}</span>
                            </span>
                            {task.timeframe && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{task.timeframe}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Target Date & Visit Mode */}
                        <td className="py-4 px-4 align-top">
                          <div className="space-y-1">
                            <span className="font-black text-slate-900 text-xs block">
                              {formattedDate}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 block">
                              {task.visit_mode || 'In-Person Clinic Visit'}
                            </span>
                            {task.clinic_location && (
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {task.clinic_location}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Pre-Visit Diagnostics */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex flex-col gap-1 max-w-[220px]">
                            {diagnostics.length > 0 ? (
                              diagnostics.map((diag, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-left truncate"
                                >
                                  <Stethoscope className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{diag}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold italic">None specified</span>
                            )}
                          </div>
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(task)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                              <span>Log Outreach</span>
                            </button>
                            <button
                              onClick={() => toggleExpandRow(task.task_id)}
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
                                    SECTION 11: COMPLETE FOLLOW-UP ASSESSMENT AUDIT RECORD
                                  </h3>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400">
                                  Task ID: #{task.task_id} • Patient ID: {task.patient_id}
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

                                {/* Right Sub-Card: Outreach History Timeline Logs */}
                                <div className="lg:col-span-6 space-y-4 border-l border-slate-200 pl-0 lg:pl-6">
                                  <div>
                                    <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                                      MOST RECENT NURSE OUTREACH SUMMARY
                                    </span>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                                      <div className="flex justify-between items-center text-slate-600 font-semibold">
                                        <span>Assigned Nurse: <strong className="text-slate-800">{task.assigned_nurse || 'Unassigned'}</strong></span>
                                        <span>Last Contact: {task.last_contact_date ? String(task.last_contact_date).split('T')[0] : 'None Recorded'}</span>
                                      </div>
                                      <div className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                                        "{task.nurse_notes || 'No outreach notes recorded yet.'}"
                                      </div>
                                    </div>
                                  </div>

                                  {/* Outreach History Logs List */}
                                  <div className="pt-2 border-t border-slate-200 space-y-2">
                                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                                      PREVIOUS OUTREACH TIMELINE LOGS
                                    </span>
                                    {logsLoading ? (
                                      <p className="text-[11px] text-slate-400 animate-pulse">Loading outreach timeline logs...</p>
                                    ) : (taskLogs[task.task_id] || []).length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">No prior outreach logs recorded in database.</p>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {(taskLogs[task.task_id] || []).map((log) => (
                                          <div key={log.log_id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] space-y-1">
                                            <div className="flex justify-between font-bold text-slate-800">
                                              <span>{log.contact_mode} • {log.nurse_name}</span>
                                              <span className="text-slate-400">{log.contact_date ? String(log.contact_date).split('T')[0] : ''}</span>
                                            </div>
                                            <div className="text-blue-700 font-semibold">{log.outcome}</div>
                                            {log.notes && <div className="text-slate-600 text-[10px]">{log.notes}</div>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
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
                <label className="block text-[11px] font-black text-slate-700">
                  Assigned Nurse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.assigned_nurse}
                  onChange={(e) => setFormData({ ...formData, assigned_nurse: e.target.value })}
                  placeholder="e.g. Nurse Anitha R., RN"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Offline Outreach Log Notes */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-700">
                  Offline Outreach Log Notes / Detailed Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
    </div>
  );
}
