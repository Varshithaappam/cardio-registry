const fs = require('fs');
const path = require('path');

// 1. Update NurseFollowUpReport.jsx
const frontendPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'NurseFollowUpReport.jsx');
let frontendCode = fs.readFileSync(frontendPath, 'utf8');

// Replace isHfDetailed / isStemiDetailed / isNstemiDetailed logic & add isDetailedForm
const oldDetailChecks = `const isHfDetailed = Boolean(log.log_type === 'detailed_hf_log') || Boolean(log.outcome && log.outcome.includes('Detailed HF Follow-up')) || Boolean(log.notes && log.notes.includes('[HF Detailed Follow-up]'));
                                        const isStemiDetailed = Boolean(log.log_type === 'detailed_stemi_log') || Boolean(log.notes && log.notes.includes('[STEMI Detailed Follow-up]')) || Boolean(log.outcome && log.outcome.includes('STEMI Form'));
                                        const isNstemiDetailed = Boolean(log.log_type === 'detailed_nstemi_log') || Boolean(log.notes && log.notes.includes('[NSTEMI Detailed Follow-up]')) || Boolean(log.outcome && log.outcome.includes('NSTEMI Form'));`;

const newDetailChecks = `const isHfDetailed = Boolean(log.log_type === 'detailed_hf_log') || Boolean(log.outcome && log.outcome.includes('Detailed HF Follow-up')) || Boolean(log.notes && log.notes.includes('[HF Detailed Follow-up]')) || Boolean(log.outcome && log.outcome.includes('Detailed HF Form'));
                                        const isStemiDetailed = Boolean(log.log_type === 'detailed_stemi_log') || Boolean(log.notes && log.notes.includes('[STEMI Detailed Follow-up]')) || Boolean(log.outcome && log.outcome.includes('STEMI Form')) || Boolean(log.outcome && log.outcome.includes('Detailed STEMI'));
                                        const isNstemiDetailed = Boolean(log.log_type === 'detailed_nstemi_log') || Boolean(log.notes && log.notes.includes('[NSTEMI Detailed Follow-up]')) || Boolean(log.outcome && log.outcome.includes('NSTEMI Form')) || Boolean(log.outcome && log.outcome.includes('Detailed NSTEMI'));
                                        const isDetailedForm = isHfDetailed || isStemiDetailed || isNstemiDetailed;`;

// Normalize line endings for replacement
frontendCode = frontendCode.replace(/\r\n/g, '\n');
const normalizedOld = oldDetailChecks.replace(/\r\n/g, '\n');
const normalizedNew = newDetailChecks.replace(/\r\n/g, '\n');

if (frontendCode.includes(normalizedOld)) {
  frontendCode = frontendCode.replace(normalizedOld, normalizedNew);
  console.log('✅ Updated detail checks in NurseFollowUpReport.jsx');
} else {
  console.log('⚠️ Could not find oldDetailChecks in NurseFollowUpReport.jsx');
}

// Replace badge text logic
const oldBadgeText = `{isHfDetailed ? 'Detailed HF Form' :
                                                   isStemiDetailed ? 'Detailed STEMI Form' :
                                                   isNstemiDetailed ? 'Detailed NSTEMI Form' :
                                                   (log.contact_mode || 'Phone Call')}`;

const newBadgeText = `{isHfDetailed ? 'DETAILED HF FORM' :
                                                   isStemiDetailed ? 'DETAILED STEMI FORM' :
                                                   isNstemiDetailed ? 'DETAILED NSTEMI FORM' :
                                                   (log.contact_mode || 'PHONE CALL')}`;

if (frontendCode.includes(oldBadgeText)) {
  frontendCode = frontendCode.replace(oldBadgeText, newBadgeText);
  console.log('✅ Updated badge text in NurseFollowUpReport.jsx');
}

// Replace symptoms and notes hiding condition (!isHfDetailed -> !isDetailedForm)
const oldSymptoms = `!isHfDetailed`;
frontendCode = frontendCode.replace(
  `{log.symptoms_status && log.symptoms_status !== 'N/A' && !isHfDetailed && (`,
  `{log.symptoms_status && log.symptoms_status !== 'N/A' && !isDetailedForm && (`
);
frontendCode = frontendCode.replace(
  `{log.notes && !isHfDetailed && (`,
  `{log.notes && !isDetailedForm && (`
);
console.log('✅ Updated symptoms & notes visibility in NurseFollowUpReport.jsx');

fs.writeFileSync(frontendPath, frontendCode, 'utf8');

// 2. Update backend/routes/nurseFollowUpReportRoutes.js
const backendPath = path.join(__dirname, '..', 'backend', 'routes', 'nurseFollowUpReportRoutes.js');
let backendCode = fs.readFileSync(backendPath, 'utf8').replace(/\r\n/g, '\n');

// Replace STEMI Task Update Block
const oldStemiUpdate = `      // Step 2: Immediately execute UPDATE on patient_followup_tasks parent record
      if (finalTaskId) {
        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.NVarChar(50), overallStatus)
          .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
          .input('targetDate', db.sql.Date, parseSqlDate(target_date))
          .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
          .query(\`
            UPDATE patient_followup_tasks
            SET 
              status = @overallStatus,
              assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
              target_date = COALESCE(@targetDate, target_date),
              nurse_notes = @notes,
              last_contact_date = GETDATE(),
              updated_at = GETDATE()
            WHERE task_id = @taskId;
          \`);
      }`;

const newStemiUpdate = `      // Step 2: Execute UPDATE on patient_followup_tasks parent record
      // Strict rule: Detailed forms DO NOT set task status to 'Completed'. Standard outreach log sets status to 'Completed' ONLY IF explicitly marked 'Completed'.
      if (finalTaskId) {
        if (isDetailedStemi) {
          await transaction.request()
            .input('taskId', db.sql.Int, finalTaskId)
            .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
            .input('targetDate', db.sql.Date, parseSqlDate(target_date))
            .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
            .query(\`
              UPDATE patient_followup_tasks
              SET 
                assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
                target_date = COALESCE(@targetDate, target_date),
                nurse_notes = @notes,
                last_contact_date = GETDATE(),
                updated_at = GETDATE()
              WHERE task_id = @taskId;
            \`);
        } else {
          const statusToUpdate = (overallStatus === 'Completed') ? 'Completed' : overallStatus;
          await transaction.request()
            .input('taskId', db.sql.Int, finalTaskId)
            .input('overallStatus', db.sql.NVarChar(50), statusToUpdate)
            .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
            .input('targetDate', db.sql.Date, parseSqlDate(target_date))
            .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
            .query(\`
              UPDATE patient_followup_tasks
              SET 
                status = @overallStatus,
                assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
                target_date = COALESCE(@targetDate, target_date),
                nurse_notes = @notes,
                last_contact_date = GETDATE(),
                updated_at = GETDATE()
              WHERE task_id = @taskId;
            \`);
        }
      }`;

if (backendCode.includes(oldStemiUpdate)) {
  backendCode = backendCode.replace(oldStemiUpdate, newStemiUpdate);
  console.log('✅ Updated STEMI task completion logic in nurseFollowUpReportRoutes.js');
} else {
  console.log('⚠️ Could not find oldStemiUpdate block');
}

// Replace NSTEMI Task Update Block
const oldNstemiUpdate = `      // Step 2: Immediately execute UPDATE on patient_followup_tasks parent record
      if (finalTaskId) {
        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.NVarChar(50), overallStatus)
          .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
          .input('targetDate', db.sql.Date, parseSqlDate(target_date))
          .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
          .query(\`
            UPDATE patient_followup_tasks
            SET 
              status = @overallStatus,
              assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
              target_date = COALESCE(@targetDate, target_date),
              nurse_notes = @notes,
              last_contact_date = GETDATE(),
              updated_at = GETDATE()
            WHERE task_id = @taskId;
          \`);
      }`;

const newNstemiUpdate = `      // Step 2: Execute UPDATE on patient_followup_tasks parent record
      // Strict rule: Detailed forms DO NOT set task status to 'Completed'. Standard outreach log sets status to 'Completed' ONLY IF explicitly marked 'Completed'.
      if (finalTaskId) {
        if (isDetailedNstemi) {
          await transaction.request()
            .input('taskId', db.sql.Int, finalTaskId)
            .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
            .input('targetDate', db.sql.Date, parseSqlDate(target_date))
            .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
            .query(\`
              UPDATE patient_followup_tasks
              SET 
                assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
                target_date = COALESCE(@targetDate, target_date),
                nurse_notes = @notes,
                last_contact_date = GETDATE(),
                updated_at = GETDATE()
              WHERE task_id = @taskId;
            \`);
        } else {
          const statusToUpdate = (overallStatus === 'Completed') ? 'Completed' : overallStatus;
          await transaction.request()
            .input('taskId', db.sql.Int, finalTaskId)
            .input('overallStatus', db.sql.NVarChar(50), statusToUpdate)
            .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
            .input('targetDate', db.sql.Date, parseSqlDate(target_date))
            .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
            .query(\`
              UPDATE patient_followup_tasks
              SET 
                status = @overallStatus,
                assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
                target_date = COALESCE(@targetDate, target_date),
                nurse_notes = @notes,
                last_contact_date = GETDATE(),
                updated_at = GETDATE()
              WHERE task_id = @taskId;
            \`);
        }
      }`;

if (backendCode.includes(oldNstemiUpdate)) {
  backendCode = backendCode.replace(oldNstemiUpdate, newNstemiUpdate);
  console.log('✅ Updated NSTEMI task completion logic in nurseFollowUpReportRoutes.js');
} else {
  console.log('⚠️ Could not find oldNstemiUpdate block');
}

// Replace HF Task Update Block
const oldHfUpdate = `      // Step 2: Immediately execute UPDATE on patient_followup_tasks parent record
      // IMPORTANT: Only update task status when submitting a standard Outreach Log (NOT HF Detailed Log)
      if (finalTaskId && !isDetailedHf) {
        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.NVarChar(50), overallStatus)
          .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Staff Nurse'))
          .input('targetDate', db.sql.Date, parseSqlDate(target_date))
          .input('notes', db.sql.NVarChar(db.sql.MAX), formattedNotes)
          .query(\`
            UPDATE patient_followup_tasks
            SET 
              status = @overallStatus,
              assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
              target_date = COALESCE(@targetDate, target_date),
              nurse_notes = @notes,
              last_contact_date = GETDATE(),
              updated_at = GETDATE()
            WHERE task_id = @taskId;
          \`);
      }`;

const newHfUpdate = `      // Step 2: Execute UPDATE on patient_followup_tasks parent record
      // Strict rule: Detailed forms DO NOT set task status to 'Completed'. Standard outreach log sets status to 'Completed' ONLY IF explicitly marked 'Completed'.
      if (finalTaskId) {
        if (isDetailedHf) {
          await transaction.request()
            .input('taskId', db.sql.Int, finalTaskId)
            .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Staff Nurse'))
            .input('targetDate', db.sql.Date, parseSqlDate(target_date))
            .input('notes', db.sql.NVarChar(db.sql.MAX), formattedNotes)
            .query(\`
              UPDATE patient_followup_tasks
              SET 
                assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
                target_date = COALESCE(@targetDate, target_date),
                nurse_notes = @notes,
                last_contact_date = GETDATE(),
                updated_at = GETDATE()
              WHERE task_id = @taskId;
            \`);
        } else {
          const statusToUpdate = (overallStatus === 'Completed') ? 'Completed' : overallStatus;
          await transaction.request()
            .input('taskId', db.sql.Int, finalTaskId)
            .input('overallStatus', db.sql.NVarChar(50), statusToUpdate)
            .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Staff Nurse'))
            .input('targetDate', db.sql.Date, parseSqlDate(target_date))
            .input('notes', db.sql.NVarChar(db.sql.MAX), formattedNotes)
            .query(\`
              UPDATE patient_followup_tasks
              SET 
                status = @overallStatus,
                assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
                target_date = COALESCE(@targetDate, target_date),
                nurse_notes = @notes,
                last_contact_date = GETDATE(),
                updated_at = GETDATE()
              WHERE task_id = @taskId;
            \`);
        }
      }`;

if (backendCode.includes(oldHfUpdate)) {
  backendCode = backendCode.replace(oldHfUpdate, newHfUpdate);
  console.log('✅ Updated HF task completion logic in nurseFollowUpReportRoutes.js');
} else {
  console.log('⚠️ Could not find oldHfUpdate block');
}

fs.writeFileSync(backendPath, backendCode, 'utf8');
console.log('Done!');
