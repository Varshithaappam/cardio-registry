const db = require('./backend/config/db');

async function testAcsColumns() {
  try {
    const pool = await db.getPool();
    const stemiCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'stemi_followup_records'");
    const nstemiCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'nstemi_followup_records'");

    const stemiNames = new Set(stemiCols.recordset.map(c => c.COLUMN_NAME));
    const nstemiNames = new Set(nstemiCols.recordset.map(c => c.COLUMN_NAME));

    const expected = [
      'reg_patient_id', 'task_id', 'stemi_id', 'nstemi_id', 'ip_no', 'acs_no', 'followup_date', 'followup_conducted', 'attempt_number',
      'answering_status', 'no_answer_reason', 'health_status', 'health_unhealthy_details',
      'medications_still_taking', 'side_effects_observed', 'side_effects_details',
      'physician_medication_changes', 'physician_medication_changes_details', 'new_health_complaints',
      'has_new_symptoms', 'selected_symptoms', 'symptom_other_details', 'medication_adherence',
      'medication_adherence_no_reason', 'drug_grid_json', 'trop_i_result', 'creatinine_result',
      'bnp_nt_probnp_result', 'hemoglobin_result', 'sodium_result', 'potassium_result', 'echo_done',
      'has_major_clinical_event', 'selected_clinical_events', 'event_other_details',
      'vaccinations_details', 'is_deceased', 'died_within_30days_discharge',
      'place_of_death', 'date_of_death', 'cause_of_death', 'cause_of_death_other_details',
      'join_program_opt_in', 'patient_feedback', 'date_of_admission', 'date_of_discharge',
      'assigned_nurse_name', 'raw_form_json', 'created_at'
    ];

    console.log("=== Missing Columns in stemi_followup_records ===");
    for (const col of expected) {
      if (col !== 'nstemi_id' && !stemiNames.has(col)) console.log("- ", col);
    }

    console.log("=== Missing Columns in nstemi_followup_records ===");
    for (const col of expected) {
      if (col !== 'stemi_id' && !nstemiNames.has(col)) console.log("- ", col);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testAcsColumns();
