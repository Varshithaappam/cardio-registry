const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * Task 1: GET /api/nurse-dashboard/tasks AND /api/nurse-followup-report/tasks
 * Patient-Centric CTE Query: Returns strictly ONE active row per patient (the latest task where rn = 1).
 */
const getPatientCentricTasks = async (req, res) => {
  try {
    const queryStr = `
      WITH RankedTasks AS (
        SELECT 
          t.task_id,
          t.patient_id,
          t.source_registry,
          t.source_record_id,
          t.is_followup_required,
          t.timeframe,
          t.target_date,
          t.visit_mode,
          t.clinic_location,
          t.special_instructions,
          t.status,
          t.assigned_nurse,
          t.nurse_notes,
          t.last_contact_date,
          ROW_NUMBER() OVER (
            PARTITION BY t.patient_id 
            ORDER BY t.task_id DESC
          ) AS rn
        FROM patient_followup_tasks t
      )
      SELECT 
        rt.task_id,
        rt.patient_id,
        rt.source_registry,
        rt.source_record_id,
        rt.is_followup_required,
        rt.timeframe,
        rt.target_date,
        rt.visit_mode,
        rt.clinic_location,
        rt.special_instructions,
        rt.status,
        rt.assigned_nurse,
        rt.nurse_notes,
        rt.last_contact_date,
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
      FROM RankedTasks rt
      INNER JOIN patient_demographics p ON rt.patient_id = p.patient_id
      LEFT JOIN hf_followup_assessments fa ON (rt.source_record_id = fa.followup_id OR (rt.patient_id = fa.patient_id AND fa.followup_id = (SELECT MAX(followup_id) FROM hf_followup_assessments WHERE patient_id = rt.patient_id)))
      WHERE rt.rn = 1
      ORDER BY rt.target_date ASC, rt.task_id DESC;
    `;

    const result = await db.query(queryStr);
    const tasks = result.recordset || [];

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching patient-centric tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient-centric follow-up tasks.',
      error: error.message
    });
  }
};

router.get('/tasks', getPatientCentricTasks);
router.get('/', getPatientCentricTasks);

/**
 * Task 2: GET /api/nurse-dashboard/:patientId/logs AND /api/nurse-followup-report/:patientId/logs
 * UNION ALL Query: Merges manual nurse outreach logs with older/superseded tasks for the patient.
 */
const getPatientTimelineLogs = async (req, res) => {
  try {
    const { patientId } = req.params;
    const pid = parseInt(patientId, 10);

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
        notes,
        'Manual Outreach Log' AS log_type
      FROM nurse_outreach_logs
      WHERE patient_id = @pid

      UNION ALL

      SELECT 
        t.task_id AS log_id,
        t.task_id,
        t.patient_id,
        COALESCE(t.last_contact_date, t.target_date, GETDATE()) AS contact_date,
        'Clinical System' AS nurse_name,
        'System Generated Form' AS contact_mode,
        CONCAT('Historical Task Status: ', t.status) AS outcome,
        'N/A' AS symptoms_status,
        'N/A' AS medication_adherence,
        CONCAT('Target Date: ', ISNULL(CONVERT(VARCHAR(10), t.target_date, 120), 'N/A'), ' | Visit Mode: ', ISNULL(t.visit_mode, 'N/A'), ' | Special Instructions: ', ISNULL(t.special_instructions, 'Standard post-discharge monitoring.')) AS notes,
        'System Generated Form' AS log_type
      FROM patient_followup_tasks t
      WHERE t.patient_id = @pid AND t.task_id NOT IN (
        SELECT TOP 1 task_id FROM patient_followup_tasks WHERE patient_id = @pid ORDER BY task_id DESC
      )

      ORDER BY contact_date DESC;
    `;

    const result = await db.query(queryStr, { pid });
    const logs = result.recordset || [];

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error(`Error fetching timeline logs for patient ${req.params.patientId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient timeline logs.',
      error: error.message
    });
  }
};

router.get('/:patientId/logs', getPatientTimelineLogs);
router.get('/tasks/:patientId/logs', getPatientTimelineLogs);

/**
 * POST /api/nurse-dashboard/tasks/:taskId/log
 * Submits a new nurse outreach log entry and updates the active task record.
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
      WHERE task_id = @finalTaskId OR (patient_id = @pid AND status != 'Completed');
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
      message: 'Outreach log saved and patient task updated successfully.'
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
