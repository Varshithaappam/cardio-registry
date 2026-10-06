const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

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
  const startTime = Date.now();
  const memBefore = process.memoryUsage();

  try {
    const rawStartDate = req.query.startDate || req.query.fromDate || req.query.start_date || null;
    const rawEndDate = req.query.endDate || req.query.toDate || req.query.end_date || null;
    const limit = parseInt(req.query.limit || '500', 10);

    const startDate = parseDateParam(rawStartDate);
    const endDate = parseDateParam(rawEndDate);

    const pool = await db.getPool();
    const request = pool.request();
    request.input('startDate', db.sql.VarChar(50), startDate || null);
    request.input('endDate', db.sql.VarChar(50), endDate || null);
    request.input('limit', db.sql.Int, limit > 0 ? limit : 500);

    const queryStr = `
      WITH LatestNSTEMI AS (
        SELECT reg_patient_id, MAX(nstemi_id) AS max_nstemi_id
        FROM nstemi_registry WITH (NOLOCK)
        GROUP BY reg_patient_id
      ),
      LatestSTEMI AS (
        SELECT reg_patient_id, MAX(stemi_id) AS max_stemi_id
        FROM stemi_registry WITH (NOLOCK)
        GROUP BY reg_patient_id
      ),
      LatestMaxHF AS (
        SELECT reg_patient_id, MAX(hf_id) AS max_hf_id
        FROM hf_registry WITH (NOLOCK)
        GROUP BY reg_patient_id
      ),
      LatestHF AS (
        SELECT reg_patient_id, MAX(followup_id) AS max_followup_id
        FROM hf_followup_assessments WITH (NOLOCK)
        GROUP BY reg_patient_id
      ),
      LatestHfAdmin AS (
        SELECT 
          r.reg_patient_id,
          adm.visit_date,
          adm.assessment_date,
          adm.discharge_date,
          ROW_NUMBER() OVER (PARTITION BY r.reg_patient_id ORDER BY r.hf_id DESC) AS rn
        FROM hf_registry r WITH (NOLOCK)
        INNER JOIN hf_administrative adm WITH (NOLOCK) ON r.hf_id = adm.hf_id
      ),
      LatestStemiRec AS (
        SELECT reg_patient_id, ip_no, acs_no,
               ROW_NUMBER() OVER (PARTITION BY reg_patient_id ORDER BY created_at DESC) AS rn
        FROM stemi_followup_records WITH (NOLOCK)
      ),
      LatestNstemiRec AS (
        SELECT reg_patient_id, ip_no, acs_no,
               ROW_NUMBER() OVER (PARTITION BY reg_patient_id ORDER BY created_at DESC) AS rn
        FROM nstemi_followup_records WITH (NOLOCK)
      ),
      RankedTasks AS (
        SELECT TOP (@limit)
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
          p.uhid,
          p.gender,
          p.phone_no,
          p.date_of_birth,
          DATEDIFF(YEAR, p.date_of_birth, GETDATE()) - 
            CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, p.date_of_birth, GETDATE()), p.date_of_birth) > GETDATE() THEN 1 ELSE 0 END AS age,
          COALESCE(
            CAST(sr.admission_date AS VARCHAR(10)),
            CAST(nr.admission_date AS VARCHAR(10)),
            CAST(adm.visit_date AS VARCHAR(10)),
            CAST(adm.assessment_date AS VARCHAR(10))
          ) AS date_of_admission,
          COALESCE(
            CAST(sr.discharge_date AS VARCHAR(10)),
            CAST(nr.discharge_date AS VARCHAR(10)),
            CAST(adm.discharge_date AS VARCHAR(10))
          ) AS date_of_discharge,
          COALESCE(
            sr.ip_no,
            nr.ip_no,
            srec.ip_no,
            nrec.ip_no
          ) AS ip_no,
          COALESCE(
            sr.acs_no,
            nr.acs_no,
            srec.acs_no,
            nrec.acs_no
          ) AS acs_no,
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
            PARTITION BY t.reg_patient_id, 
              CASE 
                WHEN t.source_registry LIKE '%Heart Failure%' THEN 'HF'
                WHEN t.source_registry LIKE '%NSTEMI%' THEN 'NSTEMI'
                WHEN t.source_registry LIKE '%STEMI%' THEN 'STEMI'
                ELSE 'HF'
              END
            ORDER BY 
              CASE 
                WHEN t.source_registry LIKE '%NSTEMI%' AND (t.source_record_id = ln.max_nstemi_id OR t.source_record_id IS NULL) THEN 0
                WHEN t.source_registry LIKE '%STEMI%' AND t.source_registry NOT LIKE '%NSTEMI%' AND (t.source_record_id = ls.max_stemi_id OR t.source_record_id IS NULL) THEN 0
                WHEN t.source_registry LIKE '%Heart Failure%' AND (t.source_record_id = lmh.max_hf_id OR t.source_record_id IS NULL) THEN 0
                ELSE 1
              END ASC,
              COALESCE(t.source_record_id, 0) DESC,
              t.task_id DESC
          ) AS row_num
        FROM patient_followup_tasks t WITH (NOLOCK)
        INNER JOIN patient_demographics p WITH (NOLOCK) ON t.reg_patient_id = p.reg_patient_id
        LEFT JOIN LatestNSTEMI ln ON t.reg_patient_id = ln.reg_patient_id
        LEFT JOIN LatestSTEMI ls ON t.reg_patient_id = ls.reg_patient_id
        LEFT JOIN LatestMaxHF lmh ON t.reg_patient_id = lmh.reg_patient_id
        LEFT JOIN LatestHF lhf ON t.reg_patient_id = lhf.reg_patient_id
        LEFT JOIN hf_followup_assessments fa WITH (NOLOCK) ON (
          t.source_registry LIKE '%Heart Failure%' AND t.source_record_id = fa.followup_id
        )
        LEFT JOIN LatestHfAdmin adm ON (t.reg_patient_id = adm.reg_patient_id AND adm.rn = 1)
        LEFT JOIN LatestStemiRec srec ON (t.reg_patient_id = srec.reg_patient_id AND srec.rn = 1)
        LEFT JOIN LatestNstemiRec nrec ON (t.reg_patient_id = nrec.reg_patient_id AND nrec.rn = 1)
        LEFT JOIN stemi_registry sr WITH (NOLOCK) ON (
          (t.source_registry LIKE '%STEMI%' AND t.source_registry NOT LIKE '%NSTEMI%')
          AND (t.source_record_id = sr.stemi_id OR (t.source_record_id IS NULL AND sr.stemi_id = ls.max_stemi_id))
        )
        LEFT JOIN nstemi_registry nr WITH (NOLOCK) ON (
          t.source_registry LIKE '%NSTEMI%'
          AND (t.source_record_id = nr.nstemi_id OR (t.source_record_id IS NULL AND nr.nstemi_id = ln.max_nstemi_id))
        )
        WHERE t.status != 'No Follow-Up Needed'
          AND t.status NOT LIKE '%Superseded%'
        ORDER BY 
          CASE WHEN t.target_date IS NULL THEN 1 ELSE 0 END ASC,
          t.target_date ASC,
          t.task_id ASC
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
        uhid,
        date_of_admission,
        date_of_discharge,
        ip_no,
        acs_no,
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

    const durationMs = Date.now() - startTime;
    const memAfter = process.memoryUsage();
    const heapUsedDeltaMb = ((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2);
    console.log(`[PERF] GET /api/nurse-dashboard/tasks completed in ${durationMs}ms | Returned ${tasks.length} tasks | Heap Used: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)}MB (Delta: ${heapUsedDeltaMb}MB)`);

    return res.status(200).json({
      success: true,
      count: tasks.length,
      durationMs,
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
          COALESCE(nol.raw_form_json, nfr.raw_form_json, sfr.raw_form_json, hfr.raw_form_json) AS raw_form_json,
          CASE 
            WHEN nol.raw_form_json IS NOT NULL OR nol.outcome LIKE '%Detailed%' OR nol.notes LIKE '%Detailed%' THEN 'detailed_nstemi_log'
            WHEN nfr.record_id IS NOT NULL THEN 'detailed_nstemi_log'
            WHEN sfr.record_id IS NOT NULL THEN 'detailed_stemi_log'
            WHEN hfr.record_id IS NOT NULL THEN 'detailed_hf_log'
            ELSE 'standard_outreach'
          END AS log_type,
          COALESCE(t.timeframe, nf.followup_month, 'Follow-Up') AS timeframe,
          -- Specific Registry & Episode Tracking
          COALESCE(nol.nstemi_id, nfr.nstemi_id, nf.nstemi_id, nr.nstemi_id, t.source_record_id, (SELECT TOP 1 n.nstemi_id FROM nstemi_registry n WHERE n.reg_patient_id = nol.reg_patient_id AND n.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY n.created_at DESC, n.nstemi_id DESC)) AS registry_id,
          COALESCE(
            nr.acs_no, 
            nr.ip_no, 
            CONCAT('NSTEMI-', CAST(COALESCE(nol.nstemi_id, nfr.nstemi_id, nf.nstemi_id, nr.nstemi_id, t.source_record_id, (SELECT TOP 1 n.nstemi_id FROM nstemi_registry n WHERE n.reg_patient_id = nol.reg_patient_id AND n.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY n.created_at DESC, n.nstemi_id DESC)) AS VARCHAR(10))),
            'NSTEMI-EPISODE'
          ) AS episode_id,
          COALESCE(t.status, 'Completed') AS episode_status,
          CASE 
            WHEN COALESCE(nol.nstemi_id, nfr.nstemi_id, nf.nstemi_id, nr.nstemi_id, t.source_record_id, (SELECT TOP 1 n.nstemi_id FROM nstemi_registry n WHERE n.reg_patient_id = nol.reg_patient_id AND n.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY n.created_at DESC, n.nstemi_id DESC)) = (
              SELECT MAX(nstemi_id) FROM nstemi_registry WHERE reg_patient_id = nol.reg_patient_id
            ) THEN 1 
            ELSE 0 
          END AS is_current_episode
        FROM nurse_outreach_logs nol
        LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
        OUTER APPLY (
          SELECT TOP 1 nf.followup_id, nf.nstemi_id, nf.followup_month
          FROM nstemi_followup nf
          WHERE (nol.nstemi_followup_id IS NOT NULL AND nf.followup_id = nol.nstemi_followup_id)
             OR (t.source_record_id IS NOT NULL AND nf.nstemi_id = t.source_record_id AND (t.timeframe IS NULL OR nf.followup_month = t.timeframe))
          ORDER BY CASE WHEN nol.nstemi_followup_id = nf.followup_id THEN 0 ELSE 1 END ASC, nf.followup_id DESC
        ) nf
        OUTER APPLY (
          SELECT TOP 1 nr.nstemi_id, nr.acs_no, nr.ip_no
          FROM nstemi_registry nr
          WHERE (nf.nstemi_id IS NOT NULL AND nr.nstemi_id = nf.nstemi_id)
             OR (t.source_record_id IS NOT NULL AND nr.nstemi_id = t.source_record_id)
             OR (nr.reg_patient_id = nol.reg_patient_id)
          ORDER BY CASE WHEN t.source_record_id = nr.nstemi_id THEN 0 ELSE 1 END ASC, nr.nstemi_id DESC
        ) nr
        OUTER APPLY (
          SELECT TOP 1 sfr.record_id, sfr.raw_form_json, sfr.stemi_id
          FROM stemi_followup_records sfr
          WHERE (nol.task_id IS NOT NULL AND sfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 10)
             OR (nol.reg_patient_id = sfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) ASC
        ) sfr
        OUTER APPLY (
          SELECT TOP 1 nfr.record_id, nfr.raw_form_json, nfr.nstemi_id
          FROM nstemi_followup_records nfr
          WHERE (nol.task_id IS NOT NULL AND nfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 10)
             OR (nol.reg_patient_id = nfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) ASC
        ) nfr
        OUTER APPLY (
          SELECT TOP 1 hfr.followup_record_id AS record_id, hfr.raw_form_json, hfr.hf_id
          FROM hf_followup_records hfr
          WHERE (nol.task_id IS NOT NULL AND hfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 10)
             OR (nol.reg_patient_id = hfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) ASC
        ) hfr
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
          COALESCE(nol.raw_form_json, sfr.raw_form_json, nfr.raw_form_json, hfr.raw_form_json) AS raw_form_json,
          CASE 
            WHEN nol.raw_form_json IS NOT NULL OR nol.outcome LIKE '%Detailed%' OR nol.notes LIKE '%Detailed%' THEN 'detailed_stemi_log'
            WHEN sfr.record_id IS NOT NULL THEN 'detailed_stemi_log'
            WHEN nfr.record_id IS NOT NULL THEN 'detailed_nstemi_log'
            WHEN hfr.record_id IS NOT NULL THEN 'detailed_hf_log'
            ELSE 'standard_outreach'
          END AS log_type,
          COALESCE(t.timeframe, sf.followup_month, 'Follow-Up') AS timeframe,
          COALESCE(nol.stemi_id, sfr.stemi_id, sf.stemi_id, sr.stemi_id, t.source_record_id, (SELECT TOP 1 s.stemi_id FROM stemi_registry s WHERE s.reg_patient_id = nol.reg_patient_id AND s.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY s.created_at DESC, s.stemi_id DESC)) AS registry_id,
          COALESCE(
            sr.acs_no, 
            sr.ip_no, 
            CONCAT('STEMI-', CAST(COALESCE(nol.stemi_id, sfr.stemi_id, sf.stemi_id, sr.stemi_id, t.source_record_id, (SELECT TOP 1 s.stemi_id FROM stemi_registry s WHERE s.reg_patient_id = nol.reg_patient_id AND s.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY s.created_at DESC, s.stemi_id DESC)) AS VARCHAR(10))),
            'STEMI-EPISODE'
          ) AS episode_id,
          COALESCE(t.status, 'Completed') AS episode_status,
          CASE 
            WHEN COALESCE(nol.stemi_id, sfr.stemi_id, sf.stemi_id, sr.stemi_id, t.source_record_id, (SELECT TOP 1 s.stemi_id FROM stemi_registry s WHERE s.reg_patient_id = nol.reg_patient_id AND s.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY s.created_at DESC, s.stemi_id DESC)) = (
              SELECT MAX(stemi_id) FROM stemi_registry WHERE reg_patient_id = nol.reg_patient_id
            ) THEN 1 
            ELSE 0 
          END AS is_current_episode
        FROM nurse_outreach_logs nol
        LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
        LEFT JOIN stemi_followup sf ON (t.source_record_id = sf.stemi_id AND t.timeframe = sf.followup_month)
        LEFT JOIN stemi_registry sr ON (sf.stemi_id = sr.stemi_id OR t.source_record_id = sr.stemi_id)
        OUTER APPLY (
          SELECT TOP 1 sfr.record_id, sfr.raw_form_json, sfr.stemi_id
          FROM stemi_followup_records sfr
          WHERE (nol.task_id IS NOT NULL AND sfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 10)
             OR (nol.reg_patient_id = sfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) ASC
        ) sfr
        OUTER APPLY (
          SELECT TOP 1 nfr.record_id, nfr.raw_form_json, nfr.nstemi_id
          FROM nstemi_followup_records nfr
          WHERE (nol.task_id IS NOT NULL AND nfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 10)
             OR (nol.reg_patient_id = nfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) ASC
        ) nfr
        OUTER APPLY (
          SELECT TOP 1 hfr.followup_record_id AS record_id, hfr.raw_form_json, hfr.hf_id
          FROM hf_followup_records hfr
          WHERE (nol.task_id IS NOT NULL AND hfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 10)
             OR (nol.reg_patient_id = hfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) ASC
        ) hfr
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
          COALESCE(nol.raw_form_json, hfr.raw_form_json, sfr.raw_form_json, nfr.raw_form_json) AS raw_form_json,
          CASE 
            WHEN nol.raw_form_json IS NOT NULL OR nol.outcome LIKE '%Detailed%' OR nol.notes LIKE '%Detailed%' THEN 'detailed_hf_log'
            WHEN hfr.record_id IS NOT NULL THEN 'detailed_hf_log'
            WHEN sfr.record_id IS NOT NULL THEN 'detailed_stemi_log'
            WHEN nfr.record_id IS NOT NULL THEN 'detailed_nstemi_log'
            ELSE 'standard_outreach'
          END AS log_type,
          COALESCE(t.timeframe, fa.followup_interval, 'Follow-Up') AS timeframe,
          -- Specific Registry & Episode Tracking
          COALESCE(nol.hf_id, hfr.hf_id, fa.hf_id, hr.hf_id, t.source_record_id, (SELECT TOP 1 h.hf_id FROM hf_registry h WHERE h.reg_patient_id = nol.reg_patient_id AND h.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY h.created_at DESC, h.hf_id DESC)) AS registry_id,
          COALESCE(
            hr.hf_registry_no, 
            CONCAT('HF00', CAST(COALESCE(nol.hf_id, hfr.hf_id, fa.hf_id, hr.hf_id, t.source_record_id, (SELECT TOP 1 h.hf_id FROM hf_registry h WHERE h.reg_patient_id = nol.reg_patient_id AND h.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY h.created_at DESC, h.hf_id DESC)) AS VARCHAR(10))),
            'HF-EPISODE'
          ) AS episode_id,
          COALESCE(t.status, hr.status, 'Completed') AS episode_status,
          CASE 
            WHEN COALESCE(nol.hf_id, hfr.hf_id, fa.hf_id, hr.hf_id, t.source_record_id, (SELECT TOP 1 h.hf_id FROM hf_registry h WHERE h.reg_patient_id = nol.reg_patient_id AND h.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY h.created_at DESC, h.hf_id DESC)) = (
              SELECT MAX(hf_id) FROM hf_registry WHERE reg_patient_id = nol.reg_patient_id
            ) THEN 1 
            ELSE 0 
          END AS is_current_episode
        FROM nurse_outreach_logs nol
        LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
        LEFT JOIN hf_followup_assessments fa ON t.source_record_id = fa.followup_id
        LEFT JOIN hf_registry hr ON COALESCE(nol.hf_id, fa.hf_id, t.source_record_id) = hr.hf_id
        OUTER APPLY (
          SELECT TOP 1 sfr.record_id, sfr.raw_form_json, sfr.stemi_id
          FROM stemi_followup_records sfr
          WHERE (nol.task_id IS NOT NULL AND sfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 10)
             OR (nol.reg_patient_id = sfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) ASC
        ) sfr
        OUTER APPLY (
          SELECT TOP 1 nfr.record_id, nfr.raw_form_json, nfr.nstemi_id
          FROM nstemi_followup_records nfr
          WHERE (nol.task_id IS NOT NULL AND nfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 10)
             OR (nol.reg_patient_id = nfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) ASC
        ) nfr
        OUTER APPLY (
          SELECT TOP 1 hfr.followup_record_id AS record_id, hfr.raw_form_json, hfr.hf_id
          FROM hf_followup_records hfr
          WHERE (nol.task_id IS NOT NULL AND hfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 10)
             OR (nol.reg_patient_id = hfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) ASC
        ) hfr
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
          COALESCE(nol.raw_form_json, sfr.raw_form_json, nfr.raw_form_json, hfr.raw_form_json) AS raw_form_json,
          CASE 
            WHEN nol.raw_form_json IS NOT NULL OR nol.outcome LIKE '%Detailed%' OR nol.notes LIKE '%Detailed%' THEN
              CASE 
                WHEN nol.registry_type = 'STEMI' OR t.source_registry LIKE '%STEMI%' THEN 'detailed_stemi_log'
                WHEN nol.registry_type = 'NSTEMI' OR t.source_registry LIKE '%NSTEMI%' THEN 'detailed_nstemi_log'
                ELSE 'detailed_hf_log'
              END
            WHEN sfr.record_id IS NOT NULL THEN 'detailed_stemi_log'
            WHEN nfr.record_id IS NOT NULL THEN 'detailed_nstemi_log'
            WHEN hfr.record_id IS NOT NULL THEN 'detailed_hf_log'
            ELSE 'standard_outreach'
          END AS log_type,
          COALESCE(t.timeframe, nf.followup_month, fa.followup_interval, 'Follow-Up') AS timeframe,
          -- Specific Registry & Episode Tracking
          CASE 
            WHEN nol.registry_type = 'NSTEMI' OR nol.nstemi_followup_id IS NOT NULL OR t.source_registry LIKE '%NSTEMI%' THEN
              COALESCE(nol.nstemi_id, nfr.nstemi_id, nf.nstemi_id, nr.nstemi_id, t.source_record_id, (SELECT TOP 1 n.nstemi_id FROM nstemi_registry n WHERE n.reg_patient_id = nol.reg_patient_id AND n.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY n.created_at DESC, n.nstemi_id DESC))
            WHEN nol.registry_type = 'STEMI' OR t.source_registry LIKE '%STEMI%' THEN
              COALESCE(nol.stemi_id, sfr.stemi_id, sf.stemi_id, sr.stemi_id, t.source_record_id, (SELECT TOP 1 s.stemi_id FROM stemi_registry s WHERE s.reg_patient_id = nol.reg_patient_id AND s.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY s.created_at DESC, s.stemi_id DESC))
            ELSE
              COALESCE(nol.hf_id, hfr.hf_id, fa.hf_id, hr.hf_id, t.source_record_id, (SELECT TOP 1 h.hf_id FROM hf_registry h WHERE h.reg_patient_id = nol.reg_patient_id AND h.created_at <= ISNULL(nol.created_at, GETDATE()) ORDER BY h.created_at DESC, h.hf_id DESC))
          END AS registry_id,
          CASE 
            WHEN nol.registry_type = 'NSTEMI' OR nol.nstemi_followup_id IS NOT NULL OR t.source_registry LIKE '%NSTEMI%' THEN
              COALESCE(nr.acs_no, nr.ip_no, CONCAT('NSTEMI-', CAST(COALESCE(t.source_record_id, nf.nstemi_id, nr.nstemi_id, 1) AS VARCHAR(10))))
            ELSE
              COALESCE(hr.hf_registry_no, CONCAT('HF00', CAST(COALESCE(fa.hf_id, hr.hf_id, t.source_record_id, 1) AS VARCHAR(10))))
          END AS episode_id,
          COALESCE(t.status, hr.status, 'Completed') AS episode_status,
          1 AS is_current_episode
        FROM nurse_outreach_logs nol
        LEFT JOIN patient_followup_tasks t ON nol.task_id = t.task_id
        LEFT JOIN hf_followup_assessments fa ON t.source_record_id = fa.followup_id
        LEFT JOIN hf_registry hr ON COALESCE(fa.hf_id, t.source_record_id) = hr.hf_id
        OUTER APPLY (
          SELECT TOP 1 nf.followup_id, nf.nstemi_id, nf.followup_month
          FROM nstemi_followup nf
          WHERE (nol.nstemi_followup_id IS NOT NULL AND nf.followup_id = nol.nstemi_followup_id)
             OR (t.source_record_id IS NOT NULL AND nf.nstemi_id = t.source_record_id AND (t.timeframe IS NULL OR nf.followup_month = t.timeframe))
          ORDER BY CASE WHEN nol.nstemi_followup_id = nf.followup_id THEN 0 ELSE 1 END ASC, nf.followup_id DESC
        ) nf
        OUTER APPLY (
          SELECT TOP 1 nr.nstemi_id, nr.acs_no, nr.ip_no
          FROM nstemi_registry nr
          WHERE (nf.nstemi_id IS NOT NULL AND nr.nstemi_id = nf.nstemi_id)
             OR (t.source_record_id IS NOT NULL AND nr.nstemi_id = t.source_record_id)
             OR (nr.reg_patient_id = nol.reg_patient_id)
          ORDER BY CASE WHEN t.source_record_id = nr.nstemi_id THEN 0 ELSE 1 END ASC, nr.nstemi_id DESC
        ) nr
        OUTER APPLY (
          SELECT TOP 1 sfr.record_id, sfr.raw_form_json, sfr.stemi_id
          FROM stemi_followup_records sfr
          WHERE (nol.task_id IS NOT NULL AND sfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 10)
             OR (nol.reg_patient_id = sfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, sfr.created_at)) ASC
        ) sfr
        OUTER APPLY (
          SELECT TOP 1 nfr.record_id, nfr.raw_form_json, nfr.nstemi_id
          FROM nstemi_followup_records nfr
          WHERE (nol.task_id IS NOT NULL AND nfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 10)
             OR (nol.reg_patient_id = sfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, nfr.created_at)) ASC
        ) nfr
        OUTER APPLY (
          SELECT TOP 1 hfr.followup_record_id AS record_id, hfr.raw_form_json, hfr.hf_id
          FROM hf_followup_records hfr
          WHERE (nol.task_id IS NOT NULL AND hfr.task_id = nol.task_id AND ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 10)
             OR (nol.reg_patient_id = hfr.reg_patient_id AND ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) <= 60)
          ORDER BY ABS(DATEDIFF(SECOND, nol.created_at, hfr.created_at)) ASC
        ) hfr
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
const parseSqlDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split('T')[0];
  }
  let str = String(val).trim();
  if (!str || str === 'null' || str === 'undefined' || str === 'N/A' || str === 'None') return null;
  if (str.includes('T')) str = str.split('T')[0];

  if (str.includes('-') || str.includes('/')) {
    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD or YYYY/MM/DD
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${y}-${m}-${d}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY or DD/MM/YYYY
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        return `${y}-${m}-${d}`;
      }
    }
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
};

const parseSqlString = (val, maxLen = 100, fallback = null) => {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val)) val = val.join(', ');
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val).trim();
  if (!str || str === 'null' || str === 'undefined') return fallback;
  return str.length > maxLen ? str.slice(0, maxLen) : str;
};

const saveDetailedAcsRecord = async (transaction, reqBody, type, pid, finalTaskId, sourceRecordId, contactMode, assignedNurse) => {
  const isStemi = type === 'STEMI';
  const tableName = isStemi ? 'stemi_followup_records' : 'nstemi_followup_records';
  const idCol = isStemi ? '[stemi_id]' : '[nstemi_id]';
  const regTable = isStemi ? '[stemi_registry]' : '[nstemi_registry]';

  let resolvedId = sourceRecordId ? parseInt(sourceRecordId, 10) : null;
  if (!resolvedId) {
    const maxRes = await transaction.request()
      .input('pid', db.sql.Int, pid)
      .query(`SELECT MAX(${idCol}) AS max_id FROM ${regTable} WHERE reg_patient_id = @pid;`);
    if (maxRes.recordset.length > 0 && maxRes.recordset[0].max_id) {
      resolvedId = maxRes.recordset[0].max_id;
    }
  }

  let admDate = parseSqlDate(reqBody.date_of_admission);
  let disDate = parseSqlDate(reqBody.date_of_discharge);
  let ipNo = parseSqlString(reqBody.ip_no, 50, null);
  let acsNo = parseSqlString(reqBody.acs_no, 50, null);

  if ((!admDate || !disDate || !ipNo || !acsNo) && resolvedId) {
    const adminDatesRes = await transaction.request()
      .input('recId', db.sql.Int, resolvedId)
      .query(`SELECT admission_date, discharge_date, ip_no, acs_no FROM ${regTable} WHERE ${idCol} = @recId;`);
    if (adminDatesRes.recordset.length > 0) {
      const row = adminDatesRes.recordset[0];
      if (!admDate) admDate = parseSqlDate(row.admission_date);
      if (!disDate) disDate = parseSqlDate(row.discharge_date);
      if (!ipNo) ipNo = parseSqlString(row.ip_no, 50, null);
      if (!acsNo) acsNo = parseSqlString(row.acs_no, 50, null);
    }
  }

  const hasTableRes = await transaction.request()
    .input('tableName', db.sql.VarChar(128), tableName)
    .query(`SELECT 1 FROM sys.tables WHERE name = @tableName`);
  if (hasTableRes.recordset.length > 0) {
    await transaction.request()
      .input('regPatientId', db.sql.Int, pid)
      .input('taskId', db.sql.Int, finalTaskId || null)
      .input('recId', db.sql.Int, resolvedId || null)
      .input('ipNo', db.sql.NVarChar(50), ipNo)
      .input('acsNo', db.sql.NVarChar(50), acsNo)
      .input('followupDate', db.sql.Date, parseSqlDate(reqBody.patient_followup_date) || parseSqlDate(new Date().toISOString()))
      .input('followupConducted', db.sql.NVarChar(100), parseSqlString(reqBody.followup_conducted || contactMode, 100, 'Telephonic follow-up'))
      .input('attemptNumber', db.sql.Int, reqBody.attempt_number || 1)
      .input('answeringStatus', db.sql.NVarChar(50), parseSqlString(reqBody.answering_status, 50, 'Yes'))
      .input('noAnswerReason', db.sql.NVarChar(255), parseSqlString(reqBody.no_answer_reason, 255, null))
      .input('healthStatus', db.sql.NVarChar(50), parseSqlString(reqBody.health_status, 50, 'Healthy'))
      .input('healthUnhealthyDetails', db.sql.NVarChar(db.sql.MAX), reqBody.health_unhealthy_details || null)
      .input('medicationsStillTaking', db.sql.NVarChar(db.sql.MAX), reqBody.medications_still_taking || null)
      .input('sideEffectsObserved', db.sql.NVarChar(50), parseSqlString(reqBody.side_effects_observed, 50, 'No'))
      .input('sideEffectsDetails', db.sql.NVarChar(db.sql.MAX), reqBody.side_effects_details || null)
      .input('physicianMedicationChanges', db.sql.NVarChar(50), parseSqlString(reqBody.physician_medication_changes, 50, 'No'))
      .input('physicianMedicationChangesDetails', db.sql.NVarChar(db.sql.MAX), reqBody.physician_medication_changes_details || null)
      .input('newHealthComplaints', db.sql.NVarChar(db.sql.MAX), reqBody.new_health_complaints || null)
      .input('hasNewSymptoms', db.sql.NVarChar(50), parseSqlString(reqBody.has_new_symptoms, 50, 'No'))
      .input('selectedSymptoms', db.sql.NVarChar(db.sql.MAX), Array.isArray(reqBody.selected_symptoms) ? reqBody.selected_symptoms.join(', ') : (reqBody.selected_symptoms || null))
      .input('symptomOtherDetails', db.sql.NVarChar(db.sql.MAX), reqBody.symptom_other_details || null)
      .input('medicationAdherence', db.sql.NVarChar(50), parseSqlString(reqBody.medication_adherence, 50, null))
      .input('medicationAdherenceNoReason', db.sql.NVarChar(db.sql.MAX), reqBody.medication_adherence_no_reason || null)
      .input('drugGridJson', db.sql.NVarChar(db.sql.MAX), reqBody.drug_grid ? JSON.stringify(reqBody.drug_grid) : null)
      .input('tropIResult', db.sql.NVarChar(100), parseSqlString(reqBody.trop_i_result, 100, null))
      .input('creatinineResult', db.sql.NVarChar(100), parseSqlString(reqBody.creatinine_result, 100, null))
      .input('bnpNtProbnpResult', db.sql.NVarChar(100), parseSqlString(reqBody.bnp_nt_probnp_result, 100, null))
      .input('hemoglobinResult', db.sql.NVarChar(100), parseSqlString(reqBody.hemoglobin_result, 100, null))
      .input('sodiumResult', db.sql.NVarChar(100), parseSqlString(reqBody.sodium_result, 100, null))
      .input('potassiumResult', db.sql.NVarChar(100), parseSqlString(reqBody.potassium_result, 100, null))
      .input('echoDone', db.sql.NVarChar(50), parseSqlString(reqBody.echo_done, 50, null))
      .input('hasMajorClinicalEvent', db.sql.NVarChar(50), parseSqlString(reqBody.has_major_clinical_event, 50, null))
      .input('selectedClinicalEvents', db.sql.NVarChar(db.sql.MAX), Array.isArray(reqBody.selected_clinical_events) ? reqBody.selected_clinical_events.join(', ') : (reqBody.selected_clinical_events || null))
      .input('eventOtherDetails', db.sql.NVarChar(db.sql.MAX), reqBody.event_other_details || null)
      .input('vaccinationsDetails', db.sql.NVarChar(db.sql.MAX), reqBody.vaccinations_details || null)
      .input('isDeceased', db.sql.NVarChar(50), parseSqlString(reqBody.is_deceased, 50, 'No'))
      .input('diedWithin30daysDischarge', db.sql.NVarChar(50), parseSqlString(reqBody.died_within_30days_discharge, 50, null))
      .input('placeOfDeath', db.sql.NVarChar(255), parseSqlString(reqBody.place_of_death, 255, null))
      .input('dateOfDeath', db.sql.Date, parseSqlDate(reqBody.date_of_death))
      .input('causeOfDeath', db.sql.NVarChar(100), parseSqlString(reqBody.cause_of_death, 100, null))
      .input('causeOfDeathOtherDetails', db.sql.NVarChar(db.sql.MAX), reqBody.cause_of_death_other_details || null)
      .input('joinProgramOptIn', db.sql.NVarChar(50), parseSqlString(reqBody.join_program_opt_in, 50, 'Yes'))
      .input('patientFeedback', db.sql.NVarChar(db.sql.MAX), reqBody.patient_feedback || null)
      .input('dateOfAdmission', db.sql.Date, admDate)
      .input('dateOfDischarge', db.sql.Date, disDate)
      .input('assignedNurseName', db.sql.NVarChar(150), parseSqlString(assignedNurse, 150, 'Cardiac Care Nurse'))
      .input('rawFormJson', db.sql.NVarChar(db.sql.MAX), JSON.stringify(reqBody))
      .query(`
        INSERT INTO ${tableName} (
          reg_patient_id, task_id, ${idCol}, ip_no, acs_no, followup_date, followup_conducted, attempt_number,
          answering_status, no_answer_reason, health_status, health_unhealthy_details,
          medications_still_taking, side_effects_observed, side_effects_details,
          physician_medication_changes, physician_medication_changes_details, new_health_complaints,
          has_new_symptoms, selected_symptoms, symptom_other_details, medication_adherence,
          medication_adherence_no_reason, drug_grid_json, trop_i_result, creatinine_result,
          bnp_nt_probnp_result, hemoglobin_result, sodium_result, potassium_result, echo_done,
          has_major_clinical_event, selected_clinical_events, event_other_details,
          vaccinations_details, is_deceased, died_within_30days_discharge,
          place_of_death, date_of_death, cause_of_death, cause_of_death_other_details,
          join_program_opt_in, patient_feedback, date_of_admission, date_of_discharge,
          assigned_nurse_name, raw_form_json, created_at
        ) VALUES (
          @regPatientId, @taskId, @recId, @ipNo, @acsNo, @followupDate, @followupConducted, @attemptNumber,
          @answeringStatus, @noAnswerReason, @healthStatus, @healthUnhealthyDetails,
          @medicationsStillTaking, @sideEffectsObserved, @sideEffectsDetails,
          @physicianMedicationChanges, @physicianMedicationChangesDetails, @newHealthComplaints,
          @hasNewSymptoms, @selectedSymptoms, @symptomOtherDetails, @medicationAdherence,
          @medicationAdherenceNoReason, @drugGridJson, @tropIResult, @creatinineResult,
          @bnpNtProbnpResult, @hemoglobinResult, @sodiumResult, @potassiumResult, @echoDone,
          @hasMajorClinicalEvent, @selectedClinicalEvents, @eventOtherDetails,
          @vaccinationsDetails, @isDeceased, @diedWithin30daysDischarge,
          @placeOfDeath, @dateOfDeath, @causeOfDeath, @causeOfDeathOtherDetails,
          @joinProgramOptIn, @patientFeedback, @dateOfAdmission, @dateOfDischarge,
          @assignedNurseName, @rawFormJson, GETDATE()
        );
      `);
  }
};

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
    const parsedTaskId = (rawTaskId && !isNaN(parseInt(rawTaskId, 10))) ? parseInt(rawTaskId, 10) : null;
    const isStemi = (registry_type === 'STEMI') || (source_registry && source_registry.includes('STEMI') && !source_registry.includes('NSTEMI')) || req.body.is_detailed_stemi_form;
    const isNstemi = (registry_type === 'NSTEMI') || (source_registry && source_registry.includes('NSTEMI')) || req.body.is_detailed_nstemi_form;
    const overallStatus = parseSqlString(status || overall_status || task_status, 50, 'Completed');
    const resolvedSymptomsStatus = symptoms_status || req.body.selected_symptoms;

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
      const isDetailedStemi = req.body.is_detailed_stemi_form || req.body.is_detailed_acs_form || req.body.drug_grid || req.body.selected_symptoms;

      // Step 1: Insert into nurse_outreach_logs
      const insertRes = await transaction.request()
        .input('finalTaskId', db.sql.Int, finalTaskId || null)
        .input('pid', db.sql.Int, pid)
        .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
        .input('contactMode', db.sql.NVarChar(50), parseSqlString(contact_mode, 50, 'Detailed Form Submission'))
        .input('outcome', db.sql.NVarChar(100), parseSqlString(outcome, 100, 'Detailed Form Logged'))
        .input('symptomsStatus', db.sql.NVarChar(150), parseSqlString(resolvedSymptomsStatus, 150, 'Stable - No symptoms'))
        .input('medicationAdherence', db.sql.NVarChar(150), parseSqlString(medication_adherence, 150, 'Compliant - Taking all meds as prescribed'))
        .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
        .input('rawFormJson', db.sql.NVarChar(db.sql.MAX), JSON.stringify(req.body))
        .input('stemiId', db.sql.Int, stemiRecordId || null)
        .input('targetDate', db.sql.Date, parseSqlDate(target_date))
        .query(`
          INSERT INTO nurse_outreach_logs (
            task_id,
            stemi_id,
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
            raw_form_json,
            next_followup_date,
            created_at
          ) VALUES (
            @finalTaskId,
            @stemiId,
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
            @rawFormJson,
            @targetDate,
            GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS log_id;
        `);

      // Step 2: Execute UPDATE on patient_followup_tasks parent record
      // Strict rule: Detailed forms DO NOT set task status to 'Completed'. Standard outreach log sets status to 'Completed' ONLY IF explicitly marked 'Completed'.
      if (finalTaskId) {
        const rawFormStatus = req.body.overall_registry_status || req.body.status || req.body.overall_status || req.body.task_status;
        const statusToUpdate = (rawFormStatus === 'Completed' || rawFormStatus === 'Patient Contacted & Appointment Confirmed' || rawFormStatus === 'Detailed Form Logged' || !rawFormStatus) ? 'Completed' : rawFormStatus;

        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.NVarChar(50), statusToUpdate)
          .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
          .input('targetDate', db.sql.Date, parseSqlDate(target_date))
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

      // Step 3: Insert detailed STEMI follow-up record if detailed form
      if (isDetailedStemi) {
        await saveDetailedAcsRecord(transaction, req.body, 'STEMI', pid, finalTaskId, stemiRecordId, contact_mode, assigned_nurse);
      }

      // Step 4: Update stemi_followup record if stemiRecordId and timeframe present
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
            .input('timeframe', db.sql.NVarChar(20), timeframe);

          let setClause = 'updated_at = GETDATE()';
          if (hasVisitMode) {
            reqStemiF.input('visitMode', db.sql.NVarChar(50), parseSqlString(visit_mode, 50, null));
            setClause += ', visit_mode = COALESCE(@visitMode, visit_mode)';
          }
          if (hasSpecialInstructions) {
            reqStemiF.input('instructions', db.sql.NVarChar(500), parseSqlString(notes, 500, null));
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
      // 2. NSTEMI Registry Branch
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
      const isDetailedNstemi = req.body.is_detailed_nstemi_form || req.body.is_detailed_acs_form || req.body.drug_grid || req.body.selected_symptoms;

      let validNstemiFollowupId = null;
      if (nstemiFollowupId) {
        try {
          const checkFkRes = await transaction.request()
            .input('checkFkId', db.sql.Int, nstemiFollowupId)
            .query(`SELECT 1 FROM dbo.nstemi_followup WHERE followup_id = @checkFkId;`);
          if (checkFkRes.recordset && checkFkRes.recordset.length > 0) {
            validNstemiFollowupId = nstemiFollowupId;
          }
        } catch (_) {}
      }

      // Step 1: Insert into nurse_outreach_logs
      const insertRes = await transaction.request()
        .input('finalTaskId', db.sql.Int, finalTaskId || null)
        .input('nstemiFollowupId', db.sql.Int, validNstemiFollowupId)
        .input('pid', db.sql.Int, pid)
        .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
        .input('contactMode', db.sql.NVarChar(50), parseSqlString(contact_mode, 50, 'Detailed Form Submission'))
        .input('outcome', db.sql.NVarChar(100), parseSqlString(outcome, 100, 'Detailed Form Logged'))
        .input('symptomsStatus', db.sql.NVarChar(150), parseSqlString(resolvedSymptomsStatus, 150, 'Stable - No symptoms'))
        .input('medicationAdherence', db.sql.NVarChar(150), parseSqlString(medication_adherence, 150, 'Compliant - Taking all meds as prescribed'))
        .input('notes', db.sql.NVarChar(db.sql.MAX), notes || '')
        .input('rawFormJson', db.sql.NVarChar(db.sql.MAX), JSON.stringify(req.body))
        .input('nstemiId', db.sql.Int, nstemiFollowupId || null)
        .input('targetDate', db.sql.Date, parseSqlDate(target_date))
        .query(`
          INSERT INTO nurse_outreach_logs (
            task_id,
            nstemi_id,
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
            raw_form_json,
            next_followup_date,
            created_at
          ) VALUES (
            @finalTaskId,
            @nstemiId,
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
            @rawFormJson,
            @targetDate,
            GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS log_id;
        `);

      // Step 2: Execute UPDATE on patient_followup_tasks parent record
      if (finalTaskId) {
        const rawFormStatus = req.body.overall_registry_status || req.body.status || req.body.overall_status || req.body.task_status;
        const statusToUpdate = (rawFormStatus === 'Completed' || rawFormStatus === 'Patient Contacted & Appointment Confirmed' || rawFormStatus === 'Detailed Form Logged' || !rawFormStatus) ? 'Completed' : rawFormStatus;

        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.NVarChar(50), statusToUpdate)
          .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Cardiac Care Nurse'))
          .input('targetDate', db.sql.Date, parseSqlDate(target_date))
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

      // Step 3: Insert detailed NSTEMI follow-up record if detailed form
      if (isDetailedNstemi) {
        await saveDetailedAcsRecord(transaction, req.body, 'NSTEMI', pid, finalTaskId, source_record_id, contact_mode, assigned_nurse);
      }

      // Step 4: Update nstemi_followup record if present
      if (nstemiFollowupId) {
        await transaction.request()
          .input('nstemiFollowupId', db.sql.Int, nstemiFollowupId)
          .input('visitMode', db.sql.NVarChar(50), parseSqlString(visit_mode, 50, null))
          .input('instructions', db.sql.NVarChar(500), parseSqlString(notes, 500, null))
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

      // Resolve specific hf_id for this task/patient snapshot
      let resolvedHfId = null;
      if (finalTaskId) {
        const taskHfRes = await transaction.request()
          .input('tid', db.sql.Int, finalTaskId)
          .query(`
            SELECT COALESCE(fa.hf_id, t.source_record_id) AS hf_id
            FROM patient_followup_tasks t
            LEFT JOIN hf_followup_assessments fa ON t.source_record_id = fa.followup_id
            WHERE t.task_id = @tid;
          `);
        if (taskHfRes.recordset.length > 0 && taskHfRes.recordset[0].hf_id) {
          resolvedHfId = taskHfRes.recordset[0].hf_id;
        }
      }

      if (!resolvedHfId) {
        const maxHfRes = await transaction.request()
          .input('pid', db.sql.Int, pid)
          .query(`SELECT MAX(hf_id) AS max_hf_id FROM hf_registry WHERE reg_patient_id = @pid;`);
        if (maxHfRes.recordset.length > 0 && maxHfRes.recordset[0].max_hf_id) {
          resolvedHfId = maxHfRes.recordset[0].max_hf_id;
        }
      }

      // Step 1: Insert into nurse_outreach_logs table
      const isDetailedHf = req.body.is_detailed_hf_form || req.body.drug_grid || req.body.selected_symptoms;
      const formattedNotes = isDetailedHf 
        ? `[HF Detailed Follow-up]\n${notes || ''}\n${JSON.stringify(req.body)}` 
        : (notes || '');

      const insertRes = await transaction.request()
        .input('finalTaskId', db.sql.Int, finalTaskId || null)
        .input('pid', db.sql.Int, pid)
        .input('hfId', db.sql.Int, resolvedHfId || null)
        .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Staff Nurse'))
        .input('contactMode', db.sql.NVarChar(50), parseSqlString(contact_mode, 50, 'Detailed Form Submission'))
        .input('outcome', db.sql.NVarChar(100), parseSqlString(outcome, 100, 'Detailed Form Logged'))
        .input('symptomsStatus', db.sql.NVarChar(150), parseSqlString(resolvedSymptomsStatus, 150, 'Stable - No worsening shortness of breath'))
        .input('medicationAdherence', db.sql.NVarChar(150), parseSqlString(medication_adherence, 150, 'Compliant - Taking all meds as prescribed'))
        .input('notes', db.sql.NVarChar(db.sql.MAX), formattedNotes)
        .input('rawFormJson', db.sql.NVarChar(db.sql.MAX), JSON.stringify(req.body))
        .input('targetDate', db.sql.Date, parseSqlDate(target_date))
        .query(`
          INSERT INTO nurse_outreach_logs (
            task_id,
            nstemi_followup_id,
            registry_type,
            reg_patient_id,
            hf_id,
            contact_date,
            nurse_name,
            contact_mode,
            outcome,
            symptoms_status,
            medication_adherence,
            notes,
            raw_form_json,
            next_followup_date,
            created_at
          ) VALUES (
            @finalTaskId,
            NULL,
            'HF',
            @pid,
            @hfId,
            GETDATE(),
            @assignedNurse,
            @contactMode,
            @outcome,
            @symptomsStatus,
            @medicationAdherence,
            @notes,
            @rawFormJson,
            @targetDate,
            GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS log_id;
        `);

      // Step 2: Execute UPDATE on patient_followup_tasks parent record
      if (finalTaskId) {
        const rawFormStatus = req.body.overall_registry_status || req.body.status || req.body.overall_status || req.body.task_status;
        const statusToUpdate = (rawFormStatus === 'Completed' || rawFormStatus === 'Patient Contacted & Appointment Confirmed' || rawFormStatus === 'Detailed Form Logged' || !rawFormStatus) ? 'Completed' : rawFormStatus;

        await transaction.request()
          .input('taskId', db.sql.Int, finalTaskId)
          .input('overallStatus', db.sql.NVarChar(50), statusToUpdate)
          .input('assignedNurse', db.sql.NVarChar(100), parseSqlString(assigned_nurse, 100, 'Staff Nurse'))
          .input('targetDate', db.sql.Date, parseSqlDate(target_date))
          .input('notes', db.sql.NVarChar(db.sql.MAX), formattedNotes)
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

      // Step 3: Record into hf_followup_records if table exists in database
      if (isDetailedHf) {
        try {
          // Resolve admission and discharge dates if missing in payload
          let admDate = parseSqlDate(req.body.date_of_admission);
          let disDate = parseSqlDate(req.body.date_of_discharge);
          if ((!admDate || !disDate) && resolvedHfId) {
            const adminDatesRes = await transaction.request()
              .input('hfid', db.sql.Int, resolvedHfId)
              .query(`SELECT visit_date, assessment_date, discharge_date FROM hf_administrative WHERE hf_id = @hfid;`);
            if (adminDatesRes.recordset.length > 0) {
              const row = adminDatesRes.recordset[0];
              if (!admDate) admDate = parseSqlDate(row.visit_date) || parseSqlDate(row.assessment_date);
              if (!disDate) disDate = parseSqlDate(row.discharge_date);
            }
          }

          const hasTableRes = await transaction.request().query(
            `SELECT 1 FROM sys.tables WHERE name = 'hf_followup_records'`
          );
          if (hasTableRes.recordset.length > 0) {
            await transaction.request()
              .input('regPatientId', db.sql.Int, pid)
              .input('taskId', db.sql.Int, finalTaskId || null)
              .input('hfId', db.sql.Int, resolvedHfId || null)
              .input('followupDate', db.sql.Date, parseSqlDate(req.body.patient_followup_date) || parseSqlDate(new Date().toISOString()))
              .input('followupConducted', db.sql.NVarChar(100), parseSqlString(req.body.followup_conducted || contact_mode, 100, 'Telephonic follow-up'))
              .input('attemptNumber', db.sql.Int, req.body.attempt_number || 1)
              .input('answeringStatus', db.sql.NVarChar(50), parseSqlString(req.body.answering_status, 50, 'Yes'))
              .input('noAnswerReason', db.sql.NVarChar(255), parseSqlString(req.body.no_answer_reason, 255, null))
              .input('healthStatus', db.sql.NVarChar(50), parseSqlString(req.body.health_status, 50, 'Healthy'))
              .input('healthUnhealthyDetails', db.sql.NVarChar(db.sql.MAX), req.body.health_unhealthy_details || null)
              .input('medicationsStillTaking', db.sql.NVarChar(db.sql.MAX), req.body.medications_still_taking || null)
              .input('sideEffectsObserved', db.sql.NVarChar(50), parseSqlString(req.body.side_effects_observed, 50, 'No'))
              .input('sideEffectsDetails', db.sql.NVarChar(db.sql.MAX), req.body.side_effects_details || null)
              .input('physicianMedicationChanges', db.sql.NVarChar(50), parseSqlString(req.body.physician_medication_changes, 50, 'No'))
              .input('physicianMedicationChangesDetails', db.sql.NVarChar(db.sql.MAX), req.body.physician_medication_changes_details || null)
              .input('dateOfAdmission', db.sql.Date, admDate)
              .input('dateOfDischarge', db.sql.Date, disDate)
              .input('selectedSymptoms', db.sql.NVarChar(db.sql.MAX), Array.isArray(req.body.selected_symptoms) ? req.body.selected_symptoms.join(', ') : (req.body.selected_symptoms || null))
              .input('symptomOtherDetails', db.sql.NVarChar(db.sql.MAX), req.body.symptom_other_details || null)
              .input('medicationAdherence', db.sql.NVarChar(50), parseSqlString(req.body.medication_adherence || medication_adherence, 50, null))
              .input('medicationAdherenceNoReason', db.sql.NVarChar(db.sql.MAX), req.body.medication_adherence_no_reason || null)
              .input('drugGridJson', db.sql.NVarChar(db.sql.MAX), req.body.drug_grid ? JSON.stringify(req.body.drug_grid) : null)
              .input('bnpNtProbnpResult', db.sql.NVarChar(100), parseSqlString(req.body.bnp_nt_probnp_result, 100, null))
              .input('creatinineResult', db.sql.NVarChar(100), parseSqlString(req.body.creatinine_result, 100, null))
              .input('sodiumResult', db.sql.NVarChar(100), parseSqlString(req.body.sodium_result, 100, null))
              .input('hemoglobinResult', db.sql.NVarChar(100), parseSqlString(req.body.hemoglobin_result, 100, null))
              .input('echoDone', db.sql.NVarChar(50), parseSqlString(req.body.echo_done, 50, null))
              .input('hasMajorClinicalEvent', db.sql.NVarChar(50), parseSqlString(req.body.has_major_clinical_event, 50, null))
              .input('selectedClinicalEvents', db.sql.NVarChar(db.sql.MAX), Array.isArray(req.body.selected_clinical_events) ? req.body.selected_clinical_events.join(', ') : (req.body.selected_clinical_events || null))
              .input('eventOtherDetails', db.sql.NVarChar(db.sql.MAX), req.body.event_other_details || null)
              .input('vaccinationsDetails', db.sql.NVarChar(db.sql.MAX), req.body.vaccinations_details || null)
              .input('isDeceased', db.sql.NVarChar(50), parseSqlString(req.body.is_deceased, 50, 'No'))
              .input('diedWithin30daysDischarge', db.sql.NVarChar(50), parseSqlString(req.body.died_within_30days_discharge, 50, null))
              .input('placeOfDeath', db.sql.NVarChar(255), parseSqlString(req.body.place_of_death, 255, null))
              .input('dateOfDeath', db.sql.Date, parseSqlDate(req.body.date_of_death))
              .input('causeOfDeath', db.sql.NVarChar(100), parseSqlString(req.body.cause_of_death, 100, null))
              .input('causeOfDeathOtherDetails', db.sql.NVarChar(db.sql.MAX), req.body.cause_of_death_other_details || null)
              .input('joinProgramOptIn', db.sql.NVarChar(50), parseSqlString(req.body.join_program_opt_in, 50, 'Yes'))
              .input('patientFeedback', db.sql.NVarChar(db.sql.MAX), req.body.patient_feedback || null)
              .input('rawFormJson', db.sql.NVarChar(db.sql.MAX), JSON.stringify(req.body))
              .query(`
                INSERT INTO hf_followup_records (
                  reg_patient_id, task_id, hf_id, followup_date, followup_conducted, attempt_number,
                  answering_status, no_answer_reason, health_status, health_unhealthy_details,
                  medications_still_taking, side_effects_observed, side_effects_details,
                  physician_medication_changes, physician_medication_changes_details,
                  date_of_admission, date_of_discharge,
                  selected_symptoms, symptom_other_details, medication_adherence,
                  medication_adherence_no_reason, drug_grid_json, bnp_nt_probnp_result,
                  creatinine_result, sodium_result, hemoglobin_result, echo_done,
                  has_major_clinical_event, selected_clinical_events, event_other_details,
                  vaccinations_details, is_deceased, died_within_30days_discharge,
                  place_of_death, date_of_death, cause_of_death, cause_of_death_other_details,
                  join_program_opt_in, patient_feedback, raw_form_json, created_at
                ) VALUES (
                  @regPatientId, @taskId, @hfId, @followupDate, @followupConducted, @attemptNumber,
                  @answeringStatus, @noAnswerReason, @healthStatus, @healthUnhealthyDetails,
                  @medicationsStillTaking, @sideEffectsObserved, @sideEffectsDetails,
                  @physicianMedicationChanges, @physicianMedicationChangesDetails,
                  @dateOfAdmission, @dateOfDischarge,
                  @selectedSymptoms, @symptomOtherDetails, @medicationAdherence,
                  @medicationAdherenceNoReason, @drugGridJson, @bnpNtProbnpResult,
                  @creatinineResult, @sodiumResult, @hemoglobinResult, @echoDone,
                  @hasMajorClinicalEvent, @selectedClinicalEvents, @eventOtherDetails,
                  @vaccinationsDetails, @isDeceased, @diedWithin30daysDischarge,
                  @placeOfDeath, @dateOfDeath, @causeOfDeath, @causeOfDeathOtherDetails,
                  @joinProgramOptIn, @patientFeedback, @rawFormJson, GETDATE()
                );
              `);
          }
        } catch (hfErr) {
          console.warn('Optional hf_followup_records save skipped:', hfErr.message);
        }
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
    } catch (rollbackErr) {
      console.warn('[DB Rollback Notice]: Could not rollback transaction:', rollbackErr.message);
    }
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
