const db = require('./backend/config/db');

async function seedLifecycleData() {
  try {
    const pool = await db.getPool();
    console.log("🌱 Starting Follow-up Lifecycle Test Patient Seed...");

    // 1. Check if patient already exists
    let pid;
    const existingP = await pool.request().query(`
      SELECT reg_patient_id FROM patient_demographics 
      WHERE patient_name LIKE '%Followup Lifecycle Patient%' OR mr_no = 'MR-FOLLOWUP-001'
    `);

    if (existingP.recordset.length > 0) {
      pid = existingP.recordset[0].reg_patient_id;
      console.log(`Found existing test patient with ID: ${pid}`);
    } else {
      await pool.request().query(`
        INSERT INTO patient_demographics (
          mr_no, ip_no, patient_name, date_of_birth, gender, phone_no, created_at, updated_at
        ) VALUES (
          'MR-FOLLOWUP-001', 'IP00010', 'Followup Lifecycle Patient', '1982-08-20', 'Female', '9876543210', GETDATE(), GETDATE()
        );
      `);
      const pIdRes = await pool.request().query(`SELECT SCOPE_IDENTITY() AS reg_patient_id;`);
      pid = pIdRes.recordset[0].reg_patient_id;
      console.log(`Created new test patient 'Followup Lifecycle Patient' (ID: ${pid}, MRN: MR-FOLLOWUP-001)`);
    }

    // Try shadow identity index sync
    try {
      await pool.request().query(`
        IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'patient_identity_index')
        BEGIN
          INSERT INTO patient_identity_index (reg_patient_id, patient_name, mr_no, phone_no, created_at)
          VALUES (${pid}, 'Followup Lifecycle Patient', 'MR-FOLLOWUP-001', '9876543210', GETDATE());
        END
      `);
    } catch (e) {
      // ignore non-critical index table error
    }

    // Clear existing test records for clean rerun
    await pool.request().query(`
      DELETE FROM nurse_outreach_logs WHERE reg_patient_id = ${pid};
      DELETE FROM patient_followup_tasks WHERE reg_patient_id = ${pid};
      DELETE FROM hf_followup_assessments WHERE reg_patient_id = ${pid};
      DELETE FROM hf_registry WHERE reg_patient_id = ${pid};
      DELETE FROM stemi_registry WHERE reg_patient_id = ${pid};
      DELETE FROM nstemi_registry WHERE reg_patient_id = ${pid};
    `);

    // -------------------------------------------------------------
    // Episode 1: HF Admission (IP00010)
    // -------------------------------------------------------------
    const hfRes = await pool.request().query(`
      INSERT INTO hf_registry (reg_patient_id, hf_registry_no, created_at, status)
      OUTPUT INSERTED.hf_id
      VALUES (${pid}, 'HF-00010', DATEADD(MONTH, -2, GETDATE()), 'final')
    `);
    const hfId = hfRes.recordset[0].hf_id;

    // Insert HF Task (Superseded by STEMI)
    const task1Res = await pool.request().query(`
      INSERT INTO patient_followup_tasks (
        reg_patient_id, source_registry, source_record_id, is_followup_required,
        timeframe, target_date, clinic_location, visit_mode, special_instructions,
        status, created_at, updated_at
      ) OUTPUT INSERTED.task_id
      VALUES (
        ${pid}, 'Heart Failure Registry', ${hfId}, 1,
        '1-Month', DATEADD(MONTH, -1, GETDATE()), 'CARE Heart Institute', 'In-Person', 'HF initial baseline assessment',
        'Superseded by new encounter', DATEADD(MONTH, -2, GETDATE()), GETDATE()
      )
    `);
    const task1Id = task1Res.recordset[0].task_id;

    // Insert HF Outreach Log
    await pool.request().query(`
      INSERT INTO nurse_outreach_logs (
        task_id, reg_patient_id, contact_date, nurse_name, contact_mode, outcome, notes, created_at, registry_type, hf_id
      ) VALUES (
        ${task1Id}, ${pid}, DATEADD(MONTH, -1, GETDATE()), 'Nurse Sarah', 'Phone Call', 'Attempt 1 - Line Busy',
        'HF Outreach: Line busy upon first call.', DATEADD(MONTH, -1, GETDATE()), 'HF', ${hfId}
      )
    `);

    // Insert HF Form Assessment
    await pool.request().query(`
      INSERT INTO hf_followup_assessments (
        hf_id, reg_patient_id, is_followup_required, followup_interval, scheduled_followup_date, visit_mode,
        special_instructions, overall_registry_status
      ) VALUES (
        ${hfId}, ${pid}, 1, '1-Month', DATEADD(MONTH, -1, GETDATE()), 'In-Person',
        'HF baseline assessment completed.', 'Completed'
      )
    `);
    console.log(`✅ Episode 1 (HF ID: ${hfId}, Task ID: ${task1Id}) created.`);

    // -------------------------------------------------------------
    // Episode 2: STEMI Admission (IP00018)
    // -------------------------------------------------------------
    const stemiRes = await pool.request().query(`
      INSERT INTO stemi_registry (reg_patient_id, acs_no, ip_no, admission_date, discharge_date, created_at, status)
      OUTPUT INSERTED.stemi_id
      VALUES (${pid}, 'ACS00018', 'IP00018', DATEADD(MONTH, -1, GETDATE()), DATEADD(DAY, -25, GETDATE()), DATEADD(MONTH, -1, GETDATE()), 'final')
    `);
    const stemiId = stemiRes.recordset[0].stemi_id;

    // Insert STEMI Task (Superseded by NSTEMI)
    const task2Res = await pool.request().query(`
      INSERT INTO patient_followup_tasks (
        reg_patient_id, source_registry, source_record_id, is_followup_required,
        timeframe, target_date, clinic_location, visit_mode, special_instructions,
        status, created_at, updated_at
      ) OUTPUT INSERTED.task_id
      VALUES (
        ${pid}, 'STEMI Registry', ${stemiId}, 1,
        '1-Month', DATEADD(DAY, 5, GETDATE()), 'CARE Heart Institute', 'In-Person', 'Post STEMI Interventional Followup',
        'Superseded by new encounter', DATEADD(MONTH, -1, GETDATE()), GETDATE()
      )
    `);
    const task2Id = task2Res.recordset[0].task_id;

    // Insert STEMI Outreach Log
    await pool.request().query(`
      INSERT INTO nurse_outreach_logs (
        task_id, reg_patient_id, contact_date, nurse_name, contact_mode, outcome, notes, created_at, registry_type, stemi_id
      ) VALUES (
        ${task2Id}, ${pid}, DATEADD(DAY, -15, GETDATE()), 'Nurse Sarah', 'Phone Call', 'Reached Patient',
        'STEMI Outreach: Patient confirmed appointment.', DATEADD(DAY, -15, GETDATE()), 'STEMI', ${stemiId}
      )
    `);
    console.log(`✅ Episode 2 (STEMI ID: ${stemiId}, Task ID: ${task2Id}) created.`);

    // -------------------------------------------------------------
    // Episode 3: NSTEMI Readmission (IP00023) - ACTIVE TASK
    // -------------------------------------------------------------
    const nstemiRes = await pool.request().query(`
      INSERT INTO nstemi_registry (reg_patient_id, acs_no, ip_no, admission_date, discharge_date, created_at, status)
      OUTPUT INSERTED.nstemi_id
      VALUES (${pid}, 'ACS00023', 'IP00023', DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, -5, GETDATE()), 'final')
    `);
    const nstemiId = nstemiRes.recordset[0].nstemi_id;

    // Insert Active Pending NSTEMI Task
    const task3Res = await pool.request().query(`
      INSERT INTO patient_followup_tasks (
        reg_patient_id, source_registry, source_record_id, is_followup_required,
        timeframe, target_date, clinic_location, visit_mode, special_instructions,
        status, created_at, updated_at
      ) OUTPUT INSERTED.task_id
      VALUES (
        ${pid}, 'NSTEMI Registry', ${nstemiId}, 1,
        '1-Month', DATEADD(DAY, 25, GETDATE()), 'CARE Heart Institute', 'In-Person', 'Post NSTEMI Clinical Evaluation & Follow-up',
        'Pending Nurse Outreach', DATEADD(DAY, -1, GETDATE()), GETDATE()
      )
    `);
    const task3Id = task3Res.recordset[0].task_id;

    console.log(`✅ Episode 3 (NSTEMI ID: ${nstemiId}, Active Task ID: ${task3Id}) created with status 'Pending Nurse Outreach'.`);

    console.log("\n=======================================================");
    console.log(`🎉 SUCCESS! Seeded patient 'Followup Lifecycle Patient' (ID: ${pid})`);
    console.log(`- Patient MRN: MR-FOLLOWUP-001`);
    console.log(`- Active Pending Task: Task #${task3Id} (NSTEMI IP00023) on Nurse Dashboard.`);
    console.log(`- Historical Superseded Tasks: Task #${task1Id} (HF IP00010) & Task #${task2Id} (STEMI IP00018).`);
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed Error:", err);
    process.exit(1);
  }
}

seedLifecycleData();
