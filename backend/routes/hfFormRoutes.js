const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * Task 3: POST /api/hf-form/submit (Auto-Supersede Integration)
 * Uses an mssql Transaction to:
 * 1. Mark existing active tasks for patient_id as 'Superseded by new assessment'.
 * 2. Insert form assessment into hf_followup_assessments and capture followup_id.
 * 3. Insert new active task into patient_followup_tasks if is_followup_required is true.
 */
router.post('/submit', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      patient_id,
      is_followup_required,
      followup_interval,
      scheduled_followup_date,
      visit_mode,
      special_instructions
    } = req.body;

    const pid = parseInt(patient_id, 10);
    const isRequired = is_followup_required === 1 || is_followup_required === true || is_followup_required === 'Yes';

    // Begin SQL Transaction
    await connection.begin();

    // Step 1: Auto-Supersede existing active tasks for this patient_id
    const supersedeSql = `
      UPDATE patient_followup_tasks
      SET status = 'Superseded by new assessment'
      WHERE patient_id = @pid 
        AND status != 'Completed' 
        AND status != 'Superseded by new assessment';
    `;
    await connection.query(supersedeSql, { pid });

    // Step 2: Insert into hf_followup_assessments using OUTPUT INSERTED.followup_id
    const insertHfSql = `
      INSERT INTO hf_followup_assessments (
        patient_id,
        is_followup_required,
        followup_interval,
        scheduled_followup_date,
        visit_mode,
        special_instructions
      )
      OUTPUT INSERTED.followup_id
      VALUES (
        @pid,
        @is_followup_required,
        @followup_interval,
        @scheduled_followup_date,
        @visit_mode,
        @special_instructions
      );
    `;

    const hfResult = await connection.query(insertHfSql, {
      pid,
      is_followup_required: isRequired ? 1 : 0,
      followup_interval: followup_interval || null,
      scheduled_followup_date: scheduled_followup_date || null,
      visit_mode: visit_mode || null,
      special_instructions: special_instructions || null
    });

    const followupId = hfResult.recordset[0].followup_id;

    // Step 3: Insert new active task into patient_followup_tasks if follow-up is required
    if (isRequired) {
      const insertTaskSql = `
        INSERT INTO patient_followup_tasks (
          patient_id,
          source_registry,
          source_record_id,
          is_followup_required,
          timeframe,
          target_date,
          visit_mode,
          special_instructions,
          status
        ) VALUES (
          @pid,
          'Heart Failure',
          @source_record_id,
          1,
          @timeframe,
          @target_date,
          @visit_mode,
          @special_instructions,
          'Pending Nurse Outreach'
        );
      `;

      await connection.query(insertTaskSql, {
        pid,
        source_record_id: followupId,
        timeframe: followup_interval || null,
        target_date: scheduled_followup_date || null,
        visit_mode: visit_mode || null,
        special_instructions: special_instructions || null
      });
    }

    // Commit SQL Transaction
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'HF Assessment saved successfully. Previous active tasks superseded.',
      followup_id: followupId
    });
  } catch (error) {
    // Rollback SQL Transaction on failure
    await connection.rollback();
    console.error('Error in HF form dual-save transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit HF form assessment.',
      error: error.message
    });
  }
});

module.exports = router;
