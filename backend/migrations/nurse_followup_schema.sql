-- SQL Server Migration Script for Nurse Follow-Up System
-- Tables: patients, patient_followup_tasks, nurse_outreach_logs, hf_followup_assessments

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'patients')
BEGIN
    CREATE TABLE patients (
        patient_id INT IDENTITY(1,1) PRIMARY KEY,
        patient_name NVARCHAR(150) NOT NULL,
        mr_no NVARCHAR(50) UNIQUE NOT NULL,
        gender NVARCHAR(20),
        phone_no NVARCHAR(30),
        date_of_birth DATE
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'patient_followup_tasks')
BEGIN
    CREATE TABLE patient_followup_tasks (
        task_id INT IDENTITY(1,1) PRIMARY KEY,
        patient_id INT NOT NULL FOREIGN KEY REFERENCES patients(patient_id),
        source_registry NVARCHAR(100),
        status NVARCHAR(50) DEFAULT 'Required',
        target_date DATE,
        timeframe NVARCHAR(50),
        clinic_location NVARCHAR(200),
        visit_mode NVARCHAR(100),
        special_instructions NVARCHAR(MAX),
        assigned_nurse NVARCHAR(100),
        nurse_notes NVARCHAR(MAX),
        last_contact_date DATETIME
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'nurse_outreach_logs')
BEGIN
    CREATE TABLE nurse_outreach_logs (
        log_id INT IDENTITY(1,1) PRIMARY KEY,
        task_id INT NOT NULL FOREIGN KEY REFERENCES patient_followup_tasks(task_id),
        patient_id INT NOT NULL FOREIGN KEY REFERENCES patients(patient_id),
        contact_date DATETIME DEFAULT GETDATE(),
        nurse_name NVARCHAR(100),
        contact_mode NVARCHAR(50),
        outcome NVARCHAR(100),
        symptoms_status NVARCHAR(150),
        medication_adherence NVARCHAR(150),
        notes NVARCHAR(MAX)
    );
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'hf_followup_assessments')
BEGIN
    CREATE TABLE hf_followup_assessments (
        followup_id INT IDENTITY(1,1) PRIMARY KEY,
        patient_id INT NOT NULL FOREIGN KEY REFERENCES patients(patient_id),
        primary_no_followup_reason NVARCHAR(255),
        pcp_transition_summary NVARCHAR(MAX),
        self_care_instructions NVARCHAR(MAX)
    );
END;
