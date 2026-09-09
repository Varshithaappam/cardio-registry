const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper to safely parse and normalize date params (YYYY-MM-DD, DD-MM-YYYY, or ISO string)
const parseDateParam = (val) => {
  if (!val) return null;
  const str = String(val).trim();
  if (str.includes('T')) return str.split('T')[0];
  if (str.includes('-') || str.includes('/')) {
    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  return str;
};

/**
 * Task 1: GET /api/nurse-dashboard/tasks AND /api/nurse-followup-report/tasks
 * Combined Multi-Registry Query:
 * 1. Bug 1 Fix: Grabs the earliest pending follow-up date (ORDER BY target_date ASC, rn = 1).
 * 2. Bug 2 Fix: Supports startDate and endDate query parameters.
 * 3. Bug 3 Fix: Pre-visit diagnostics explicitly set to NULL for NSTEMI records (no ghost data bleed).
 */
const getPatientCentricTasks = async (req, res) => {
  try {
    const rawStartDate = req.query.startDate || req.query.fromDate || req.query.start_date || null;
    const rawEndDate = req.query.endDate || req.query.toDate || req.query.end_date || null;

    const startDate = parseDateParam(rawStartDate);
    const endDate = parseDateParam(rawEndDate);

    const pool = await db.getPool();
    const request = pool.request();
    request.input('startDate', db.sql.Date, startDate);
    request.input('endDate', db.sql.Date, endDate);

    const queryStr = `
      WITH RankedTasks AS (
        SELECT 
          t.task_id,
          t.reg_patient_id,
          t.source_registry,
          CASE 
            WHEN t.source_registry LIKE '%Heart Failure%' THEN 'HF'
            WHEN t.source_registry LIKE '%NSTEMI%' THEN 'NSTEMI'
            WHEN t.source_registry LIKE '%STEMI%' THEN 'STEMI'
            ELSE 'HF'
          END AS registry_type,
          t.source_record_id,
          CAST(t.is_followup_required AS VARCHAR(50)) AS is_followup_required,
          t.timeframe,
          COALESCE(t.target_date, fa.scheduled_followup_date) AS target_date,
          COALESCE(t.target_date, fa.scheduled_followup_date) AS followup_date,
          t.visit_mode,
          t.clinic_location,
          t.special_instructions,
          t.status,
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
          fa.investigation_6mw_test,
          NULL AS pre_visit_diagnostics,
          ROW_NUMBER() OVER (
            PARTITION BY t.reg_patient_id, t.source_registry 
            ORDER BY 
              CASE WHEN t.status != 'Completed' THEN 1 ELSE 2 END ASC,
              CASE WHEN COALESCE(t.target_date, fa.scheduled_followup_date) IS NULL THEN 1 ELSE 0 END ASC,
              COALESCE(t.target_date, fa.scheduled_followup_date) ASC,
              t.task_id ASC
          ) AS row_num
        FROM patient_followup_tasks t
        INNER JOIN patient_demographics p ON t.reg_patient_id = p.reg_patient_id
        LEFT JOIN hf_followup_assessments fa ON (
          t.source_registry LIKE '%Heart Failure%' AND (
            t.source_record_id = fa.followup_id OR 
            (t.reg_patient_id = fa.reg_patient_id AND fa.followup_id = (SELECT MAX(followup_id) FROM hf_followup_assessments WHERE reg_patient_id = t.reg_patient_id))
          )
        )
        WHERE t.status != 'No Follow-Up Needed'
          AND t.status != 'Superseded by new assessment'
      )
      SELECT 
        task_id,
        reg_patient_id,
        source_registry,
        registry_type,
        source_record_id,
        is_followup_required,
        timeframe,
        target_date,
        followup_date,
        visit_mode,
        clinic_location,
        special_instructions,
        status,
        assigned_nurse,
        nurse_notes,
        last_contact_date,
        patient_name,
        mr_no,
        gender,
        phone_no,
        date_of_birth,
        age,
        primary_followup_reason,
        primary_no_followup_reason,
        pcp_transition_summary,
        self_care_instructions,
        investigation_serum_lytes,
        investigation_ecg,
        investigation_echo,
        investigation_bnp_ntprobnp,
        investigation_6mw_test,
        pre_visit_diagnostics,
        row_num AS rn
      FROM RankedTasks
      WHERE 
        row_num = 1
        AND (@startDate IS NULL OR target_date >= @startDate)
        AND (@endDate IS NULL OR target_date <= @endDate)
      ORDER BY 
        CASE WHEN target_date IS NULL THEN 1 ELSE 0 END ASC,
        target_date ASC,
        task_id ASC;
    `;

    const result = await request.query(queryStr);
    const rawTasks = result.recordset || [];

    // Normalize date properties across all records (target_date in YYYY-MM-DD for consistency)
    const tasks = rawTasks.map((t) => {
      const dateVal = t.target_date || t.followup_date;
      let isoDate = null;
      if (dateVal) {
        if (dateVal instanceof Date) {
          const year = dateVal.getFullYear();
          const month = String(dateVal.getMonth() + 1).padStart(2, '0');
          const day = String(dateVal.getDate()).padStart(2, '0');
          isoDate = `${year}-${month}-${day}`;
        } else if (typeof dateVal === 'string') {
          isoDate = dateVal.split('T')[0];
        }
      }

      return {
        ...t,
        target_date: isoDate,
        followup_date: isoDate,
        scheduled_followup_date: isoDate,
        targetDate: isoDate
      };
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching combined patient-centric tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch combined follow-up tasks.',
      error: error.message
    });
  }
};

router.get('/tasks', getPatientCentricTasks);
router.get('/', getPatientCentricTasks);

/**
 * Task 2: GET /api/nurse-dashboard/:regPatientId/logs AND /api/nurse-followup-report/:regPatientId/logs
 * Query accepts ?registry=NSTEMI or ?registry_type=HF to isolate clinical history timeline per pathway.
 */
const getPatientTimelineLogs = async (req, res) => {
  try {
    const rawPid = req.params.regPatientId || req.query.patientId || req.query.reg_patient_id;
    const pid = parseInt(rawPid, 10);
    const rawRegistry = req.query.registry || req.query.registry_type || req.query.registryType || null;
    const registryType = rawRegistry ? rawRegistry.trim().toUpperCase() : null;

    if (!pid || isNaN(pid)) {
      return res.status(400).json({
        success: false,
        error: 'Valid patient ID is required.'
      });
    }

    const pool = await db.getPool();
    const request = pool.request();
    request.input('pid', db.sql.Int, pid);
    request.input('registryType', db.sql.VarChar(50), registryType);

    let queryStr = '';

    if (registryType === 'NSTEMI') {
      // 1. Isolated NSTEMI Outreach Logs with Episode Tracking
      queryStr = `
        SELECT 
          nol.log_id,
          nol.task_id,
          nol.nstemi_followup_id,
          'NSTEMI' AS registry_type,
          nol.reg_patient_id,
          COALESCE(nol.created_at, CAST(nol.contact_date AS DATETIME2)) AS contact_date,
          nol.created_at,
          nol.nurse_name,
          nol.contact_mode,
          nol.outcome,
          nol.symptoms_status,
          nol.medication_adherence,
          nol.notes,
          'Manual Outreach Log' AS log_type,
          COALESCE(t.timeframe, nf.followup_month, 'Follow-Up') AS timeframe,
          -- Specific Registry & Episode Tracking
          COALESCE(t.source_record_id, nf.nstemi_id, nr.nstemi_id, (SELECT MAX(nstemi_id) FROM nstemi_registry WHERE reg_patient_id = nol.reg_patient_id)) AS registry_id,
          COALESCE(
            nr.acs_no, 
            nr.ip_no, 
            CONCAT('NSTEMI-', RIGHT(CONCAT('00', CAST(COALESCE(t.source_record_id, nf.nstemi_id, nr.nstemi_id, (SELECT MAX(nstemi_id) FROM nstemi_registry WHERE reg_patient_id = nol.reg_patient_id)) AS VARCHAR(10))), 2)),
            'NSTEMI-EPISODE'
          ) AS episode_id,
          COALESCE(t.status, 'Completed') AS episode_status,
          CASE 
            WHEN COALESCE(t.source_record_id, nf.nstemi_id, nr.nstemi_id, (SELECT MAX(nstemi_id) FROM nstemi_registry WHERE reg_patient_id = nol.reg_patient_id)) = (
              SELECT MAX(nstemi_id) FROM nstemi_registry WHERE reg_patient_id = nol.reg_patient_id AND (status = 0 OR status IS NULL)
            ) THEN 1 
            ELSE 0 
          END AS is_current_episode
        FROM nurse_outreach_logs nol
        LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
        LEFT JOIN nstemi_followup nf ON (nol.nstemi_followup_id = nf.followup_id OR (t.source_record_id = nf.nstemi_id AND t.timeframe = nf.followup_month))
        LEFT JOIN nstemi_registry nr ON (nf.nstemi_id = nr.nstemi_id OR t.source_record_id = nr.nstemi_id)
        WHERE nol.reg_patient_id = @pid 
          AND (
            nol.registry_type = 'NSTEMI' 
            OR (t.source_registry LIKE '%NSTEMI%')
            OR (nol.registry_type IS NULL AND nol.nstemi_followup_id IS NOT NULL)
          )
        ORDER BY COALESCE(nol.created_at, CAST(nol.contact_date AS DATETIME2)) DESC, nol.log_id DESC;
      `;
    } else if (registryType === 'STEMI') {
      // 2. Isolated STEMI Outreach Logs with Episode Tracking
      queryStr = `
        SELECT 
          nol.log_id,
          nol.task_id,
          nol.nstemi_followup_id,
          'STEMI' AS registry_type,
          nol.reg_patient_id,
          COALESCE(nol.created_at, CAST(nol.contact_date AS DATETIME2)) AS contact_date,
          nol.created_at,
          nol.nurse_name,
          nol.contact_mode,
          nol.outcome,
          nol.symptoms_status,
          nol.medication_adherence,
          nol.notes,
          'Manual Outreach Log' AS log_type,
          COALESCE(t.timeframe, sf.followup_month, 'Follow-Up') AS timeframe,
          COALESCE(t.source_record_id, sf.stemi_id, sr.stemi_id, (SELECT MAX(stemi_id) FROM stemi_registry WHERE reg_patient_id = nol.reg_patient_id)) AS registry_id,
          COALESCE(
            sr.acs_no, 
            sr.ip_no, 
            CONCAT('STEMI-', RIGHT(CONCAT('00', CAST(COALESCE(t.source_record_id, sf.stemi_id, sr.stemi_id, (SELECT MAX(stemi_id) FROM stemi_registry WHERE reg_patient_id = nol.reg_patient_id)) AS VARCHAR(10))), 2)),
            'STEMI-EPISODE'
          ) AS episode_id,
          COALESCE(t.status, 'Completed') AS episode_status,
          CASE 
            WHEN COALESCE(t.source_record_id, sf.stemi_id, sr.stemi_id, (SELECT MAX(stemi_id) FROM stemi_registry WHERE reg_patient_id = nol.reg_patient_id)) = (
              SELECT MAX(stemi_id) FROM stemi_registry WHERE reg_patient_id = nol.reg_patient_id AND (status = 0 OR status IS NULL)
            ) THEN 1 
            ELSE 0 
          END AS is_current_episode
        FROM nurse_outreach_logs nol
        LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
        LEFT JOIN stemi_followup sf ON (t.source_record_id = sf.stemi_id AND t.timeframe = sf.followup_month)
        LEFT JOIN stemi_registry sr ON (sf.stemi_id = sr.stemi_id OR t.source_record_id = sr.stemi_id)
        WHERE nol.reg_patient_id = @pid 
          AND (
            nol.registry_type = 'STEMI' 
            OR (t.source_registry LIKE '%STEMI%')
          )
        ORDER BY COALESCE(nol.created_at, CAST(nol.contact_date AS DATETIME2)) DESC, nol.log_id DESC;
      `;
    } else if (registryType === 'HF' || registryType === 'HEART FAILURE') {
      // 3. Isolated Heart Failure Outreach Logs with Episode Tracking
      queryStr = `
        SELECT 
          nol.log_id,
          nol.task_id,
          nol.nstemi_followup_id,
          'HF' AS registry_type,
          nol.reg_patient_id,
          COALESCE(nol.created_at, CAST(nol.contact_date AS DATETIME2)) AS contact_date,
          nol.created_at,
          nol.nurse_name,
          nol.contact_mode,
          nol.outcome,
          nol.symptoms_status,
          nol.medication_adherence,
          nol.notes,
          'Manual Outreach Log' AS log_type,
          COALESCE(t.timeframe, fa.followup_interval, 'Follow-Up') AS timeframe,
          -- Specific Registry & Episode Tracking
          COALESCE(fa.hf_id, hr.hf_id, t.source_record_id, (SELECT MAX(hf_id) FROM hf_registry WHERE reg_patient_id = nol.reg_patient_id)) AS registry_id,
          COALESCE(
            hr.hf_registry_no, 
            CONCAT('HF-', RIGHT(CONCAT('00', CAST(COALESCE(fa.hf_id, hr.hf_id, t.source_record_id, (SELECT MAX(hf_id) FROM hf_registry WHERE reg_patient_id = nol.reg_patient_id)) AS VARCHAR(10))), 2)),
            'HF-EPISODE'
          ) AS episode_id,
          COALESCE(t.status, hr.status, 'Completed') AS episode_status,
          CASE 
            WHEN COALESCE(fa.hf_id, hr.hf_id, t.source_record_id, (SELECT MAX(hf_id) FROM hf_registry WHERE reg_patient_id = nol.reg_patient_id)) = (
              SELECT MAX(hf_id) FROM hf_registry WHERE reg_patient_id = nol.reg_patient_id
            ) THEN 1 
            ELSE 0 
          END AS is_current_episode
        FROM nurse_outreach_logs nol
        LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
        LEFT JOIN hf_followup_assessments fa ON t.source_record_id = fa.followup_id
        LEFT JOIN hf_registry hr ON COALESCE(fa.hf_id, t.source_record_id) = hr.hf_id
        WHERE nol.reg_patient_id = @pid 
          AND (
            nol.registry_type = 'HF' 
            OR nol.registry_type = 'Heart Failure'
            OR (t.source_registry LIKE '%Heart Failure%')
            OR (nol.registry_type IS NULL AND nol.nstemi_followup_id IS NULL)
          )
        ORDER BY COALESCE(nol.created_at, CAST(nol.contact_date AS DATETIME2)) DESC, nol.log_id DESC;
      `;
    } else {
      // 3. General Fallback with Episode Tracking
      queryStr = `
        SELECT 
          nol.log_id,
          nol.task_id,
          nol.nstemi_followup_id,
          ISNULL(nol.registry_type, CASE WHEN nol.nstemi_followup_id IS NOT NULL OR t.source_registry LIKE '%NSTEMI%' THEN 'NSTEMI' ELSE 'HF' END) AS registry_type,
          nol.reg_patient_id,
          COALESCE(nol.created_at, CAST(nol.contact_date AS DATETIME2)) AS contact_date,
          nol.created_at,
          nol.nurse_name,
          nol.contact_mode,
          nol.outcome,
          nol.symptoms_status,
          nol.medication_adherence,
          nol.notes,
          'Manual Outreach Log' AS log_type,
          COALESCE(t.timeframe, nf.followup_month, fa.followup_interval, 'Follow-Up') AS timeframe,
          -- Specific Registry & Episode Tracking
          CASE 
            WHEN nol.registry_type = 'NSTEMI' OR nol.nstemi_followup_id IS NOT NULL OR t.source_registry LIKE '%NSTEMI%' THEN
              COALESCE(t.source_record_id, nf.nstemi_id, nr.nstemi_id, (SELECT MAX(nstemi_id) FROM nstemi_registry WHERE reg_patient_id = nol.reg_patient_id))
            ELSE
              COALESCE(fa.hf_id, hr.hf_id, t.source_record_id, (SELECT MAX(hf_id) FROM hf_registry WHERE reg_patient_id = nol.reg_patient_id))
          END AS registry_id,
          CASE 
            WHEN nol.registry_type = 'NSTEMI' OR nol.nstemi_followup_id IS NOT NULL OR t.source_registry LIKE '%NSTEMI%' THEN
              COALESCE(nr.acs_no, nr.ip_no, CONCAT('NSTEMI-', RIGHT(CONCAT('00', CAST(COALESCE(t.source_record_id, nf.nstemi_id, nr.nstemi_id, 1) AS VARCHAR(10))), 2)))
            ELSE
              COALESCE(hr.hf_registry_no, CONCAT('HF-', RIGHT(CONCAT('00', CAST(COALESCE(fa.hf_id, hr.hf_id, t.source_record_id, 1) AS VARCHAR(10))), 2)))
          END AS episode_id,
          COALESCE(t.status, hr.status, 'Completed') AS episode_status,
          1 AS is_current_episode
        FROM nurse_outreach_logs nol
        LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
        LEFT JOIN hf_followup_assessments fa ON t.source_record_id = fa.followup_id
        LEFT JOIN hf_registry hr ON COALESCE(fa.hf_id, t.source_record_id) = hr.hf_id
        LEFT JOIN nstemi_followup nf ON (nol.nstemi_followup_id = nf.followup_id OR (t.source_record_id = nf.nstemi_id AND t.timeframe = nf.followup_month))
        LEFT JOIN nstemi_registry nr ON (nf.nstemi_id = nr.nstemi_id OR t.source_record_id = nr.nstemi_id)
        WHERE nol.reg_patient_id = @pid
        ORDER BY COALESCE(nol.created_at, CAST(nol.contact_date AS DATETIME2)) DESC, nol.log_id DESC;
      `;
    }

    const result = await request.query(queryStr);
    const logs = result.recordset || [];

    return res.status(200).json({
      success: true,
      count: logs.length,
      registry_type: registryType,
      data: logs
    });
  } catch (error) {
    console.error(`Error fetching timeline logs for patient ${req.params.regPatientId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient timeline logs.',
      error: error.message
    });
  }
};

router.get('/:regPatientId/logs', getPatientTimelineLogs);
router.get('/tasks/:regPatientId/logs', getPatientTimelineLogs);

/**
 * POST /api/nurse-dashboard/tasks/:taskId/log & /api/nurse-followup-report/tasks/:taskId/log
 * Submits a new nurse outreach log entry and synchronizes the parent task status:
 * 1. Executes INSERT into nurse_outreach_logs.
 * 2. Immediately executes UPDATE on patient_followup_tasks (or nstemi_followup) within the same SQL transaction.
 */
const postLog = async (req, res) => {
  const pool = await db.getPool();
  const transaction = pool.transaction();

  try {
    const rawTaskId = req.params.taskId || req.body.task_id;
    const {
      reg_patient_id,
      registry_type,
      source_registry,
      source_record_id,
      timeframe,
      visit_mode,
      contact_mode,
      outcome,
      status,
      overall_status,
      task_status,
      target_date,
      symptoms_status,
      medication_adherence,
      assigned_nurse,
      notes
    } = req.body;

    if (!reg_patient_id) {
      return res.status(400).json({
        success: false,
        error: 'reg_patient_id is required to record outreach log.'
      });
    }

    const pid = parseInt(reg_patient_id, 10);
    const parsedTaskId = rawTaskId ? parseInt(rawTaskId, 10) : null;
    const isStemi = (registry_type === 'STEMI') || (source_registry && source_registry.includes('STEMI'));
    const isNstemi = (registry_type === 'NSTEMI') || (source_registry && source_registry.includes('NSTEMI'));
    const overallStatus = status || overall_status || task_status || 'Completed';

    await transaction.begin();

    if (isStemi) {
      // -------------------------------------------------------------
      // 1. STEMI Registry Branch
      // -------------------------------------------------------------
      let finalTaskId = parsedTaskId;

      if (!finalTaskId) {
        const findTaskRes = await transaction.request()
          .input('pid', db.sql.Int, pid)
          .query(`
            SELECT TOP 1 task_id 
            FROM patient_followup_tasks 
            WHERE reg_patient_id = @pid AND source_registry = 'STEMI Registry'
            ORDER BY CASE WHEN status != 'Completed' THEN 0 ELSE 1 END ASC, target_date ASC, task_id ASC;
          `);
        if (findTaskRes.recordset.length > 0) {
          finalTaskId = findTaskRes.recordset[0].task_id;
        }
      }

      const stemiRecordId = source_record_id ? parseInt(source_record_id, 10) : null;

      // Step 1: Insert into nurse_outreach_logs
      const insertRes = await transaction.request()
        .input('finalTaskId', db.sql.Int, finalTaskId || null)
        .input('pid', db.sql.Int, pid)
        .input('assignedNurse', db.sql.VarChar(100), assigned_nurse || 'Cardiac Care Nurse')
        .input('contactMode', db.sql.VarChar(50), contact_mode || 'Phone Call')
        .input('outcome', db.sql.VarChar(100), outcome || 'Patient Contacted & Appointment Confirmed')
        .input('symptomsStatus', db.sql.VarChar(100), symptoms_status || 'Stable - No symptoms')
        .input('medicationAdherence', db.sql.VarChar(100), medication_adherence || 'Compliant - Taking all meds as prescribed')
        .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
        .input('targetDate', db.sql.Date, target_date || null)
        .query(`
          INSERT INTO nurse_outreach_logs (
            task_id,
            nstemi_followup_id,
            registry_type,
            reg_patient_id,
            contact_date,
            nurse_name,
            contact_mode,
            outcome,
            symptoms_status,
            medication_adherence,
            notes,
            next_followup_date,
            created_at
          ) VALUES (
            @finalTaskId,
            NULL,
            'STEMI',
            @pid,
            GETDATE(),
            @assignedNurse,
            @contactMode,
            @outcome,
            @symptomsStatus,
            @medicationAdherence,
            @notes,
            @targetDate,
            GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS log_id;
        `);

      // Step 2: Immediately execute UPDATE on patient_followup_tasks parent record
      if (finalTaskId) {
        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.VarChar(50), overallStatus)
          .input('assignedNurse', db.sql.VarChar(100), assigned_nurse || 'Cardiac Care Nurse')
          .input('targetDate', db.sql.Date, target_date || null)
          .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
          .query(`
            UPDATE patient_followup_tasks
            SET 
              status = @overallStatus,
              assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
              target_date = COALESCE(@targetDate, target_date),
              nurse_notes = @notes,
              last_contact_date = GETDATE(),
              updated_at = GETDATE()
            WHERE task_id = @taskId;
          `);
      }

      // Step 3: Update stemi_followup record if stemiRecordId and timeframe present
      if (stemiRecordId && timeframe) {
        const visitModeRes = await transaction.request().query(
          `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup') AND name = 'visit_mode'`
        );
        const hasVisitMode = visitModeRes.recordset.length > 0;

        const specInstRes = await transaction.request().query(
          `SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.stemi_followup') AND name = 'special_instructions'`
        );
        const hasSpecialInstructions = specInstRes.recordset.length > 0;

        if (hasVisitMode || hasSpecialInstructions) {
          const reqStemiF = transaction.request()
            .input('stemiId', db.sql.Int, stemiRecordId)
            .input('timeframe', db.sql.VarChar(20), timeframe);

          let setClause = 'updated_at = GETDATE()';
          if (hasVisitMode) {
            reqStemiF.input('visitMode', db.sql.VarChar(50), visit_mode || null);
            setClause += ', visit_mode = COALESCE(@visitMode, visit_mode)';
          }
          if (hasSpecialInstructions) {
            reqStemiF.input('instructions', db.sql.NVarChar(500), notes || null);
            setClause += ', special_instructions = COALESCE(@instructions, special_instructions)';
          }

          await reqStemiF.query(`
            UPDATE stemi_followup
            SET ${setClause}
            WHERE stemi_id = @stemiId AND followup_month = @timeframe;
          `);
        }
      }

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'STEMI outreach log recorded and synced successfully.',
        log_id: insertRes.recordset[0]?.log_id,
        status: overallStatus
      });

    } else if (isNstemi) {
      // -------------------------------------------------------------
      // 1. NSTEMI Registry Branch
      // -------------------------------------------------------------
      let finalTaskId = parsedTaskId;

      if (!finalTaskId) {
        const findTaskRes = await transaction.request()
          .input('pid', db.sql.Int, pid)
          .query(`
            SELECT TOP 1 task_id 
            FROM patient_followup_tasks 
            WHERE reg_patient_id = @pid AND source_registry = 'NSTEMI Registry'
            ORDER BY CASE WHEN status != 'Completed' THEN 0 ELSE 1 END ASC, target_date ASC, task_id ASC;
          `);
        if (findTaskRes.recordset.length > 0) {
          finalTaskId = findTaskRes.recordset[0].task_id;
        }
      }

      const nstemiFollowupId = source_record_id 
        ? parseInt(source_record_id, 10) 
        : (finalTaskId && finalTaskId >= 100000 ? finalTaskId - 100000 : null);

      // Step 1: Insert into nurse_outreach_logs
      const insertRes = await transaction.request()
        .input('finalTaskId', db.sql.Int, finalTaskId || null)
        .input('nstemiFollowupId', db.sql.Int, nstemiFollowupId || null)
        .input('pid', db.sql.Int, pid)
        .input('assignedNurse', db.sql.VarChar(100), assigned_nurse || 'Cardiac Care Nurse')
        .input('contactMode', db.sql.VarChar(50), contact_mode || 'Phone Call')
        .input('outcome', db.sql.VarChar(100), outcome || 'Patient Contacted & Appointment Confirmed')
        .input('symptomsStatus', db.sql.VarChar(100), symptoms_status || 'Stable - No symptoms')
        .input('medicationAdherence', db.sql.VarChar(100), medication_adherence || 'Compliant - Taking all meds as prescribed')
        .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
        .input('targetDate', db.sql.Date, target_date || null)
        .query(`
          INSERT INTO nurse_outreach_logs (
            task_id,
            nstemi_followup_id,
            registry_type,
            reg_patient_id,
            contact_date,
            nurse_name,
            contact_mode,
            outcome,
            symptoms_status,
            medication_adherence,
            notes,
            next_followup_date,
            created_at
          ) VALUES (
            @finalTaskId,
            @nstemiFollowupId,
            'NSTEMI',
            @pid,
            GETDATE(),
            @assignedNurse,
            @contactMode,
            @outcome,
            @symptomsStatus,
            @medicationAdherence,
            @notes,
            @targetDate,
            GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS log_id;
        `);

      // Step 2: Immediately execute UPDATE on patient_followup_tasks parent record
      if (finalTaskId) {
        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.VarChar(50), overallStatus)
          .input('assignedNurse', db.sql.VarChar(100), assigned_nurse || 'Cardiac Care Nurse')
          .input('targetDate', db.sql.Date, target_date || null)
          .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
          .query(`
            UPDATE patient_followup_tasks
            SET 
              status = @overallStatus,
              assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
              target_date = COALESCE(@targetDate, target_date),
              nurse_notes = @notes,
              last_contact_date = GETDATE(),
              updated_at = GETDATE()
            WHERE task_id = @taskId;
          `);
      }

      // Step 3: Update nstemi_followup record if present
      if (nstemiFollowupId) {
        await transaction.request()
          .input('nstemiFollowupId', db.sql.Int, nstemiFollowupId)
          .input('visitMode', db.sql.VarChar(50), visit_mode || null)
          .input('instructions', db.sql.NVarChar(500), notes || null)
          .query(`
            UPDATE nstemi_followup
            SET 
              visit_mode = COALESCE(@visitMode, visit_mode),
              special_instructions = COALESCE(@instructions, special_instructions),
              updated_at = GETDATE()
            WHERE followup_id = @nstemiFollowupId;
          `);
      }

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'NSTEMI outreach log recorded and synced successfully.',
        log_id: insertRes.recordset[0]?.log_id,
        status: overallStatus
      });

    } else {
      // -------------------------------------------------------------
      // 2. Heart Failure (HF) Registry Branch
      // -------------------------------------------------------------
      let finalTaskId = parsedTaskId;

      // If taskId is not explicitly provided, find the active task for this patient
      if (!finalTaskId) {
        const findTaskRes = await transaction.request()
          .input('pid', db.sql.Int, pid)
          .query(`
            SELECT TOP 1 task_id 
            FROM patient_followup_tasks 
            WHERE reg_patient_id = @pid 
            ORDER BY CASE WHEN status != 'Completed' THEN 0 ELSE 1 END ASC, task_id DESC;
          `);
        if (findTaskRes.recordset.length > 0) {
          finalTaskId = findTaskRes.recordset[0].task_id;
        }
      }

      // Step 1: Insert into nurse_outreach_logs table
      const insertRes = await transaction.request()
        .input('finalTaskId', db.sql.Int, finalTaskId || null)
        .input('pid', db.sql.Int, pid)
        .input('assignedNurse', db.sql.VarChar(100), assigned_nurse || 'Staff Nurse')
        .input('contactMode', db.sql.VarChar(50), contact_mode || 'Phone Call')
        .input('outcome', db.sql.VarChar(100), outcome || 'Patient Contacted & Appointment Confirmed')
        .input('symptomsStatus', db.sql.VarChar(100), symptoms_status || 'Stable - No worsening shortness of breath')
        .input('medicationAdherence', db.sql.VarChar(100), medication_adherence || 'Compliant - Taking all meds as prescribed')
        .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
        .input('targetDate', db.sql.Date, target_date || null)
        .query(`
          INSERT INTO nurse_outreach_logs (
            task_id,
            nstemi_followup_id,
            registry_type,
            reg_patient_id,
            contact_date,
            nurse_name,
            contact_mode,
            outcome,
            symptoms_status,
            medication_adherence,
            notes,
            next_followup_date,
            created_at
          ) VALUES (
            @finalTaskId,
            NULL,
            'HF',
            @pid,
            GETDATE(),
            @assignedNurse,
            @contactMode,
            @outcome,
            @symptomsStatus,
            @medicationAdherence,
            @notes,
            @targetDate,
            GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS log_id;
        `);

      // Step 2: Immediately execute UPDATE on patient_followup_tasks parent record
      if (finalTaskId) {
        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.VarChar(50), overallStatus)
          .input('assignedNurse', db.sql.VarChar(100), assigned_nurse || 'Staff Nurse')
          .input('targetDate', db.sql.Date, target_date || null)
          .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
          .query(`
            UPDATE patient_followup_tasks
            SET 
              status = @overallStatus,
              assigned_nurse = COALESCE(@assignedNurse, assigned_nurse),
              target_date = COALESCE(@targetDate, target_date),
              nurse_notes = @notes,
              last_contact_date = GETDATE(),
              updated_at = GETDATE()
            WHERE task_id = @taskId;
          `);
      }

      // Step 3: Update hf_followup_assessments if source_record_id is provided
      if (source_record_id) {
        await transaction.request()
          .input('sourceRecordId', db.sql.Int, parseInt(source_record_id, 10))
          .input('targetDate', db.sql.Date, target_date || null)
          .input('visitMode', db.sql.VarChar(50), visit_mode || null)
          .input('instructions', db.sql.NVarChar(db.sql.MAX), notes || null)
          .query(`
            UPDATE hf_followup_assessments
            SET 
              scheduled_followup_date = COALESCE(@targetDate, scheduled_followup_date),
              visit_mode = COALESCE(@visitMode, visit_mode),
              special_instructions = COALESCE(@instructions, special_instructions)
            WHERE followup_id = @sourceRecordId;
          `);
      }

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Heart Failure outreach log recorded and parent task status synced successfully.',
        log_id: insertRes.recordset[0]?.log_id,
        task_id: finalTaskId,
        status: overallStatus
      });
    }

  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {}
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
router.post('/logs', postLog);
router.post('/tasks/log', postLog);

module.exports = router;
