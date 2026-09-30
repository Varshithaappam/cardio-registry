const fs = require('fs');
const path = require('path');

// 1. Update NurseFollowUpReport.jsx
const frontendPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'NurseFollowUpReport.jsx');
let frontendCode = fs.readFileSync(frontendPath, 'utf8').replace(/\r\n/g, '\n');

// Clean handleOpenModal to not pre-fill notes with detailed form template text
const oldHandleOpenModal = `  // 5. Open Log Outreach Modal
  const handleOpenModal = (task) => {
    setSelectedTask(task);
    const loggedInNurse = getLoggedInNurseName();
    setFormData({
      contact_mode: 'Phone Call',
      outcome: 'Patient Contacted & Appointment Confirmed',
      status: task.status || 'Pending Nurse Outreach',
      target_date: task.target_date ? String(task.target_date).split('T')[0] : '',
      symptoms_status: 'Stable - No worsening shortness of breath',
      medication_adherence: 'Compliant - Taking all meds as prescribed',
      assigned_nurse: loggedInNurse || task.assigned_nurse || '',
      notes: task.nurse_notes || ''
    });
    setIsModalOpen(true);
  };`;

const newHandleOpenModal = `  // 5. Open Log Outreach Modal
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
    setFormData({
      contact_mode: 'Phone Call',
      outcome: 'Patient Contacted & Appointment Confirmed',
      status: task.status || 'Pending Nurse Outreach',
      target_date: task.target_date ? String(task.target_date).split('T')[0] : '',
      symptoms_status: 'Stable - No worsening shortness of breath',
      medication_adherence: 'Compliant - Taking all meds as prescribed',
      assigned_nurse: loggedInNurse || task.assigned_nurse || '',
      notes: initialNotes
    });
    setIsModalOpen(true);
  };`;

if (frontendCode.includes(oldHandleOpenModal)) {
  frontendCode = frontendCode.replace(oldHandleOpenModal, newHandleOpenModal);
  console.log('✅ Updated handleOpenModal in NurseFollowUpReport.jsx');
} else {
  console.log('⚠️ Could not find oldHandleOpenModal in NurseFollowUpReport.jsx');
}

// Update handleSubmitLog to explicitly set is_standard_outreach flag
const oldSubmitLog = `    const payload = {
      reg_patient_id: selectedTask.reg_patient_id,
      task_id: selectedTask.task_id,
      registry_type: regType,
      source_registry: selectedTask.source_registry,
      source_record_id: selectedTask.source_record_id,
      timeframe: selectedTask.timeframe,
      visit_mode: selectedTask.visit_mode,
      ...formData
    };`;

const newSubmitLog = `    const payload = {
      is_standard_outreach: true,
      reg_patient_id: selectedTask.reg_patient_id,
      task_id: selectedTask.task_id,
      registry_type: regType,
      source_registry: selectedTask.source_registry,
      source_record_id: selectedTask.source_record_id,
      timeframe: selectedTask.timeframe,
      visit_mode: selectedTask.visit_mode,
      ...formData
    };`;

if (frontendCode.includes(oldSubmitLog)) {
  frontendCode = frontendCode.replace(oldSubmitLog, newSubmitLog);
  console.log('✅ Updated handleSubmitLog in NurseFollowUpReport.jsx');
} else {
  console.log('⚠️ Could not find oldSubmitLog in NurseFollowUpReport.jsx');
}

// Update renderLogCard in NurseFollowUpReport.jsx
const oldRenderLogCard = `                                       const renderLogCard = (log, index, isCurrent) => {
                                         const episodeTag = log.episode_id || (log.registry_id ? \`\${log.registry_type || 'HF'}-\${String(log.registry_id).padStart(2, '0')}\` : 'Episode');
                                         const statusText = log.episode_status || 'Completed';
                                         const isHfDetailed = Boolean(log.log_type === 'detailed_hf_log') || Boolean(log.outcome && log.outcome.includes('Detailed HF Follow-up')) || Boolean(log.notes && log.notes.includes('[HF Detailed Follow-up]')) || Boolean(log.outcome && log.outcome.includes('Detailed HF Form'));
                                         const isStemiDetailed = Boolean(log.log_type === 'detailed_stemi_log') || Boolean(log.notes && log.notes.includes('[STEMI Detailed Follow-up]')) || Boolean(log.outcome && log.outcome.includes('STEMI Form')) || Boolean(log.outcome && log.outcome.includes('Detailed STEMI'));
                                         const isNstemiDetailed = Boolean(log.log_type === 'detailed_nstemi_log') || Boolean(log.notes && log.notes.includes('[NSTEMI Detailed Follow-up]')) || Boolean(log.outcome && log.outcome.includes('NSTEMI Form')) || Boolean(log.outcome && log.outcome.includes('Detailed NSTEMI'));
                                         const isDetailedForm = isHfDetailed || isStemiDetailed || isNstemiDetailed;`;

const newRenderLogCard = `                                       const renderLogCard = (log, index, isCurrent) => {
                                         const episodeTag = log.episode_id || (log.registry_id ? \`\${log.registry_type || 'HF'}-\${String(log.registry_id).padStart(2, '0')}\` : 'Episode');
                                         const statusText = log.episode_status || 'Completed';
                                         const isStandardOutreach = log.log_type === 'standard_outreach' || log.log_type === 'Manual Outreach Log' || log.outcome === 'Patient Contacted & Appointment Confirmed';
                                         const isHfDetailed = !isStandardOutreach && (log.log_type === 'detailed_hf_log' || Boolean(log.notes && log.notes.includes('[HF Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed HF Form')) && !log.notes?.includes('[STEMI Detailed') && !log.notes?.includes('[NSTEMI Detailed')));
                                         const isStemiDetailed = !isStandardOutreach && (log.log_type === 'detailed_stemi_log' || Boolean(log.notes && log.notes.includes('[STEMI Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed STEMI Form')) && !log.notes?.includes('[HF Detailed') && !log.notes?.includes('[NSTEMI Detailed')));
                                         const isNstemiDetailed = !isStandardOutreach && (log.log_type === 'detailed_nstemi_log' || Boolean(log.notes && log.notes.includes('[NSTEMI Detailed Follow-up]')) || (Boolean(log.outcome && log.outcome.includes('Detailed NSTEMI Form')) && !log.notes?.includes('[HF Detailed') && !log.notes?.includes('[STEMI Detailed')));
                                         const isDetailedForm = (isHfDetailed || isStemiDetailed || isNstemiDetailed) && !isStandardOutreach;`;

if (frontendCode.includes(oldRenderLogCard)) {
  frontendCode = frontendCode.replace(oldRenderLogCard, newRenderLogCard);
  console.log('✅ Updated renderLogCard discriminators in NurseFollowUpReport.jsx');
} else {
  console.log('⚠️ Could not find oldRenderLogCard in NurseFollowUpReport.jsx');
}

fs.writeFileSync(frontendPath, frontendCode, 'utf8');

// 2. Update backend/routes/nurseFollowUpReportRoutes.js SQL queries
const backendPath = path.join(__dirname, '..', 'backend', 'routes', 'nurseFollowUpReportRoutes.js');
let backendCode = fs.readFileSync(backendPath, 'utf8').replace(/\r\n/g, '\n');

// Replace log_type CASE statement across all UNION queries
const oldCaseLogType = `          CASE 
            WHEN sfr.record_id IS NOT NULL THEN 'detailed_stemi_log'
            WHEN nfr.record_id IS NOT NULL THEN 'detailed_nstemi_log'
            WHEN hfr.record_id IS NOT NULL THEN 'detailed_hf_log'
            ELSE 'Manual Outreach Log'
          END AS log_type`;

const newCaseLogType = `          CASE 
            WHEN sfr.record_id IS NOT NULL AND (nol.outcome LIKE '%STEMI%' OR nol.notes LIKE '%[STEMI Detailed%') THEN 'detailed_stemi_log'
            WHEN nfr.record_id IS NOT NULL AND (nol.outcome LIKE '%NSTEMI%' OR nol.notes LIKE '%[NSTEMI Detailed%') THEN 'detailed_nstemi_log'
            WHEN hfr.record_id IS NOT NULL AND (nol.outcome LIKE '%HF%' OR nol.notes LIKE '%[HF Detailed%') THEN 'detailed_hf_log'
            WHEN nol.outcome LIKE '%Detailed STEMI Form%' OR nol.notes LIKE '%[STEMI Detailed Follow-up]%' THEN 'detailed_stemi_log'
            WHEN nol.outcome LIKE '%Detailed NSTEMI Form%' OR nol.notes LIKE '%[NSTEMI Detailed Follow-up]%' THEN 'detailed_nstemi_log'
            WHEN nol.outcome LIKE '%Detailed HF Form%' OR nol.notes LIKE '%[HF Detailed Follow-up]%' THEN 'detailed_hf_log'
            ELSE 'standard_outreach'
          END AS log_type`;

const oldCaseHfLogType = `          CASE 
            WHEN hfr.record_id IS NOT NULL THEN 'detailed_hf_log'
            WHEN sfr.record_id IS NOT NULL THEN 'detailed_stemi_log'
            WHEN nfr.record_id IS NOT NULL THEN 'detailed_nstemi_log'
            ELSE 'Manual Outreach Log'
          END AS log_type`;

backendCode = backendCode.split(oldCaseLogType).join(newCaseLogType);
backendCode = backendCode.split(oldCaseHfLogType).join(newCaseLogType);

// Replace OUTER APPLY time thresholds from 300 to 10 seconds so previous forms don't match future outreach call logs
backendCode = backendCode.split(`DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 300`).join(`DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 10`);
backendCode = backendCode.split(`DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 300`).join(`DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 10`);
backendCode = backendCode.split(`DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 300`).join(`DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 10`);

fs.writeFileSync(backendPath, backendCode, 'utf8');
console.log('✅ Updated backend SQL UNION log_type logic and OUTER APPLY time thresholds in nurseFollowUpReportRoutes.js');
console.log('Done!');
