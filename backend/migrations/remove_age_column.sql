-- Migration: Remove age column from patients table (if it exists)
-- Date of Birth (date_of_birth) is the single source of truth for patient age.
-- Age must always be calculated dynamically in the application layer.

-- Check whether the age column exists before running:
-- SHOW COLUMNS FROM patients LIKE 'age';

ALTER TABLE patients DROP COLUMN IF EXISTS age;
