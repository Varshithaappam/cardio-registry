const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * GET /api/nurse-followup-report/tasks AND /api/nurse-dashboard/tasks
 * Task-Centric Route: Displays ALL follow-up assessments registered in the database,
 * allowing multiple follow-up rows per patient if multiple forms are registered.
 */
const getTasks = async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        ISNULL(t.task_id, fa.followup_id) AS task_id,
        fa.followup_id,
        COALESCE(fa.patient_id, t.patient_id) AS patient_id,
        ISNULL(t.source_registry, 'Heart Failure Registry') AS source_registry,
        ISNULL(t.status, CASE WHEN fa.is_followup_required = 1 OR fa.is_followup_required = '1' THEN 'Required' ELSE 'No Follow-Up Needed' END) AS status,
        COALESCE(fa.scheduled_followup_date, t.target_date) AS target_date,
        COALESCE(fa.followup_interval, t.timeframe) AS timeframe,
        ISNULL(t.clinic_location, 'CARE Heart Institute') AS clinic_location,
        COALESCE(fa.visit_mode, t.visit_mode, 'In-Person Clinic Visit') AS visit_mode,
        COALESCE(fa.special_instructions, t.special_instructions) AS special_instructions,
        t.assigned_nurse,
        t.nurse_notes,
        t.last_contact_date,
        p.patient_name,
        p.mr_no,
        p.gender,
        p.phone_no,
        p.date_of_birth,
        DATEDIFF(YEAR, p.date_of_birth, GETDATE()) - 
          CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, p.date_of_birth, GETDATE()), p.date_of_birth) > GETDATE() THEN 1 ELSE 0 END AS age,
        fa.primary_followup_reason,
        fa.primary_no_followup_reason,
        fa.pcp_transition_summary,
        fa.self_care_instructions,
        fa.investigation_serum_lytes,
        fa.investigation_ecg,
        fa.investigation_echo,
        fa.investigation_bnp_ntprobnp,
        fa.investigation_6mw_test
      FROM hf_followup_assessments fa
      INNER JOIN patients p ON fa.patient_id = p.patient_id
      LEFT JOIN patient_followup_tasks t ON fa.patient_id = t.patient_id
      UNION
      SELECT 
        t.task_id,
        NULL AS followup_id,
        t.patient_id,
        t.source_registry,
        t.status,
        t.target_date,
        t.timeframe,
        t.clinic_location,
        t.visit_mode,
        t.special_instructions,
        t.assigned_nurse,
        t.nurse_notes,
        t.last_contact_date,
        p.patient_name,
        p.mr_no,
        p.gender,
        p.phone_no,
        p.date_of_birth,
        DATEDIFF(YEAR, p.date_of_birth, GETDATE()) - 
          CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, p.date_of_birth, GETDATE()), p.date_of_birth) > GETDATE() THEN 1 ELSE 0 END AS age,
        NULL AS primary_followup_reason,
        NULL AS primary_no_followup_reason,
        NULL AS pcp_transition_summary,
        NULL AS self_care_instructions,
        NULL AS investigation_serum_lytes,
        NULL AS investigation_ecg,
        NULL AS investigation_echo,
        NULL AS investigation_bnp_ntprobnp,
        NULL AS investigation_6mw_test
      FROM patient_followup_tasks t
      INNER JOIN patients p ON t.patient_id = p.patient_id
      WHERE t.patient_id NOT IN (SELECT patient_id FROM hf_followup_assessments WHERE patient_id IS NOT NULL)
      ORDER BY target_date ASC, task_id DESC;
    `;

    const result = await db.query(queryStr);
    const tasks = result.recordset || [];

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching nurse follow-up tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-up tasks.',
      error: error.message
    });
  }
};

router.get('/tasks', getTasks);
router.get('/', getTasks);

/**
 * GET /api/nurse-followup-report/tasks/:taskId/logs AND /api/nurse-followup-report/:taskId/logs
 * Fetches outreach history timeline from nurse_outreach_logs for a specific task.
 */
const getTaskLogs = async (req, res) => {
  try {
    const { taskId } = req.params;
    const tid = parseInt(taskId, 10);

    const queryStr = `
      SELECT 
        log_id,
        task_id,
        patient_id,
        contact_date,
        nurse_name,
        contact_mode,
        outcome,
        symptoms_status,
        medication_adherence,
        notes
      FROM nurse_outreach_logs
      WHERE task_id = @tid OR patient_id = @tid
      ORDER BY contact_date DESC, log_id DESC;
    `;

    const result = await db.query(queryStr, { tid });
    const logs = result.recordset || [];

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error(`Error fetching outreach logs for task ${req.params.taskId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch outreach logs.',
      error: error.message
    });
  }
};

router.get('/tasks/:taskId/logs', getTaskLogs);
router.get('/:taskId/logs', getTaskLogs);

/**
 * POST /api/nurse-followup-report/tasks/:taskId/log AND /api/nurse-followup-report/:taskId/log
 * Submits a new nurse outreach log entry and updates the task record.
 */
const postLog = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { taskId } = req.params;
    const {
      patient_id,
      contact_mode,
      outcome,
      status,
      target_date,
      symptoms_status,
      medication_adherence,
      assigned_nurse,
      notes
    } = req.body;

    await connection.begin();

    const pid = patient_id ? parseInt(patient_id, 10) : null;
    let finalTaskId = parseInt(taskId, 10);

    const updateTaskSql = `
      UPDATE patient_followup_tasks
      SET 
        status = @status,
        assigned_nurse = @assigned_nurse,
        target_date = @target_date,
        nurse_notes = @notes,
        last_contact_date = GETDATE()
      WHERE task_id = @finalTaskId OR patient_id = @pid;
    `;
    await connection.query(updateTaskSql, {
      finalTaskId,
      pid,
      status: status || 'Pending Nurse Outreach',
      assigned_nurse: assigned_nurse || 'Staff Nurse',
      target_date: target_date || null,
      notes: notes || ''
    });

    const insertLogSql = `
      INSERT INTO nurse_outreach_logs (
        task_id,
        patient_id,
        contact_date,
        nurse_name,
        contact_mode,
        outcome,
        symptoms_status,
        medication_adherence,
        notes
      ) VALUES (
        @finalTaskId,
        @pid,
        GETDATE(),
        @assigned_nurse,
        @contact_mode,
        @outcome,
        @symptoms_status,
        @medication_adherence,
        @notes
      );
    `;

    await connection.query(insertLogSql, {
      finalTaskId,
      pid,
      assigned_nurse: assigned_nurse || 'Staff Nurse',
      contact_mode: contact_mode || 'Phone Call',
      outcome: outcome || 'Patient Contacted & Appointment Confirmed',
      symptoms_status: symptoms_status || 'Stable - No worsening shortness of breath',
      medication_adherence: medication_adherence || 'Compliant - Taking all meds as prescribed',
      notes: notes || ''
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Outreach log saved and task updated successfully.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording nurse outreach log:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record outreach log.',
      error: error.message
    });
  }
};

router.post('/tasks/:taskId/log', postLog);
router.post('/:taskId/log', postLog);

module.exports = router;
